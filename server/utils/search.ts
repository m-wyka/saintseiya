import { and, desc, eq, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';
import type { ContentLocale } from '#shared/utils/locales';
import { DEFAULT_LOCALE } from '#shared/utils/locales';
import { routes } from '#shared/utils/routes';
import { MINIMUM_SEARCH_LENGTH } from '#shared/utils/search';
import { schema, useDb } from './db';
import { localized } from './translations';

const RESULTS_PER_KIND = 6;
const EXCERPT_RADIUS = 90;

interface SearchResult {
  title: string;
  url: string;
  excerpt: string;
  context: string;
}

const likePattern = (phrase: string): string => `%${phrase.toLocaleLowerCase('pl').replace(/[\\%_]/g, '\\$&')}%`;

const contains = (column: SQLiteColumn | SQL, pattern: string) =>
  sql`lower_unicode(${column}) LIKE ${pattern} ESCAPE '\\'`;

const htmlContains = (column: SQLiteColumn | SQL, pattern: string) =>
  sql`searchable_text(${column}) LIKE ${pattern} ESCAPE '\\'`;

const excerptAround = (html: string, phrase: string): string => {
  const text = htmlToPlainText(html);
  const position = text.toLocaleLowerCase('pl').indexOf(phrase.toLocaleLowerCase('pl'));
  const start = Math.max(0, position - EXCERPT_RADIUS);
  const end = Math.min(text.length, Math.max(position, 0) + phrase.length + EXCERPT_RADIUS);
  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
};

const searchNews = (phrase: string, pattern: string, locale: ContentLocale): SearchResult[] => {
  const title = localized(schema.news.title, locale);
  const excerptHtml = localized(schema.news.excerptHtml, locale);
  const bodyHtml = localized(schema.news.bodyHtml, locale);
  return useDb()
    .select({ title, slug: schema.news.slug, excerptHtml, bodyHtml })
    .from(schema.news)
    .where(
      and(
        eq(schema.news.status, 'published'),
        sql`(${contains(title, pattern)} OR ${htmlContains(excerptHtml, pattern)} OR ${htmlContains(bodyHtml, pattern)})`,
      ),
    )
    .orderBy(desc(schema.news.publishedAt))
    .limit(RESULTS_PER_KIND)
    .all()
    .map((news) => ({
      title: news.title,
      url: routes.news(news.slug),
      excerpt: excerptAround(`${news.excerptHtml} ${news.bodyHtml}`, phrase),
      context: 'News',
    }));
};

const searchPages = (phrase: string, pattern: string, locale: ContentLocale): SearchResult[] => {
  const title = localized(schema.pages.title, locale);
  const bodyHtml = localized(schema.pages.bodyHtml, locale);
  return useDb()
    .select({ title, path: schema.pages.path, bodyHtml })
    .from(schema.pages)
    .where(
      and(
        eq(schema.pages.status, 'published'),
        sql`(${contains(title, pattern)} OR ${htmlContains(bodyHtml, pattern)})`,
      ),
    )
    .orderBy(sql`${contains(title, pattern)} DESC`, schema.pages.path)
    .limit(RESULTS_PER_KIND)
    .all()
    .map((page) => ({
      title: page.title,
      url: routes.page(page.path),
      excerpt: excerptAround(page.bodyHtml, phrase),
      context: `/${page.path}`,
    }));
};

const searchForum = (phrase: string, pattern: string, locale: ContentLocale): SearchResult[] =>
  useDb()
    .select({
      postId: schema.posts.id,
      bodyHtml: schema.posts.bodyHtml,
      threadTitle: schema.threads.title,
      forumName: localized(schema.forums.name, locale),
    })
    .from(schema.posts)
    .innerJoin(schema.threads, eq(schema.threads.id, schema.posts.threadId))
    .innerJoin(schema.forums, eq(schema.forums.id, schema.threads.forumId))
    .where(
      and(
        eq(schema.forums.isStaffOnly, false),
        sql`(${contains(schema.threads.title, pattern)} OR ${htmlContains(schema.posts.bodyHtml, pattern)})`,
      ),
    )
    .orderBy(desc(schema.posts.createdAt))
    .limit(RESULTS_PER_KIND)
    .all()
    .map((post) => ({
      title: post.threadTitle,
      url: routes.post(post.postId),
      excerpt: excerptAround(post.bodyHtml, phrase),
      context: `Forum · ${post.forumName}`,
    }));

const searchFaq = (phrase: string, pattern: string, locale: ContentLocale): SearchResult[] => {
  const title = localized(schema.faqItems.title, locale);
  const descriptionHtml = localized(schema.faqItems.descriptionHtml, locale);
  return useDb()
    .select({
      id: schema.faqItems.id,
      title,
      descriptionHtml,
      categoryName: localized(schema.faqCategories.name, locale),
    })
    .from(schema.faqItems)
    .innerJoin(schema.faqCategories, eq(schema.faqCategories.id, schema.faqItems.categoryId))
    .where(sql`(${contains(title, pattern)} OR ${htmlContains(descriptionHtml, pattern)})`)
    .orderBy(
      sql`${contains(title, pattern)} DESC`,
      schema.faqCategories.sortOrder,
      schema.faqItems.sortOrder,
      schema.faqItems.id,
    )
    .limit(RESULTS_PER_KIND)
    .all()
    .map((item) => ({
      title: item.title,
      url: routes.faqItem(item.id),
      excerpt: excerptAround(item.descriptionHtml, phrase),
      context: `FAQ · ${item.categoryName}`,
    }));
};

export const searchSite = (rawPhrase: string, locale: ContentLocale = DEFAULT_LOCALE) => {
  const phrase = rawPhrase.trim();
  if (phrase.length < MINIMUM_SEARCH_LENGTH) {
    return { phrase, news: [], pages: [], faq: [], forum: [] };
  }
  const pattern = likePattern(phrase);
  return {
    phrase,
    news: searchNews(phrase, pattern, locale),
    pages: searchPages(phrase, pattern, locale),
    faq: searchFaq(phrase, pattern, locale),
    forum: searchForum(phrase, pattern, locale),
  };
};
