import { and, desc, eq, sql } from 'drizzle-orm';
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';
import { routes } from '#shared/utils/routes';
import { schema, useDb } from './db';

const RESULTS_PER_KIND = 12;
const EXCERPT_RADIUS = 90;
export const MINIMUM_SEARCH_LENGTH = 3;

export interface SearchResult {
  title: string;
  url: string;
  excerpt: string;
  context: string;
}

const likePattern = (phrase: string): string => `%${phrase.toLocaleLowerCase('pl').replace(/[\\%_]/g, '\\$&')}%`;

const contains = (column: SQLiteColumn, pattern: string) => sql`lower_unicode(${column}) LIKE ${pattern} ESCAPE '\\'`;

const excerptAround = (html: string, phrase: string): string => {
  const text = htmlToPlainText(html);
  const position = text.toLocaleLowerCase('pl').indexOf(phrase.toLocaleLowerCase('pl'));
  const start = Math.max(0, position - EXCERPT_RADIUS);
  const end = Math.min(text.length, Math.max(position, 0) + phrase.length + EXCERPT_RADIUS);
  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
};

const searchNews = (phrase: string, pattern: string): SearchResult[] =>
  useDb()
    .select({
      title: schema.news.title,
      slug: schema.news.slug,
      excerptHtml: schema.news.excerptHtml,
      bodyHtml: schema.news.bodyHtml,
    })
    .from(schema.news)
    .where(
      and(
        eq(schema.news.status, 'published'),
        sql`(${contains(schema.news.title, pattern)} OR ${contains(schema.news.excerptHtml, pattern)} OR ${contains(schema.news.bodyHtml, pattern)})`,
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

const searchPages = (phrase: string, pattern: string): SearchResult[] =>
  useDb()
    .select({ title: schema.pages.title, path: schema.pages.path, bodyHtml: schema.pages.bodyHtml })
    .from(schema.pages)
    .where(
      and(
        eq(schema.pages.status, 'published'),
        sql`(${contains(schema.pages.title, pattern)} OR ${contains(schema.pages.bodyHtml, pattern)})`,
      ),
    )
    .orderBy(sql`${contains(schema.pages.title, pattern)} DESC`, schema.pages.path)
    .limit(RESULTS_PER_KIND)
    .all()
    .map((page) => ({
      title: page.title,
      url: routes.page(page.path),
      excerpt: excerptAround(page.bodyHtml, phrase),
      context: `/${page.path}`,
    }));

const searchForum = (phrase: string, pattern: string): SearchResult[] =>
  useDb()
    .select({
      postId: schema.posts.id,
      bodyHtml: schema.posts.bodyHtml,
      threadTitle: schema.threads.title,
      forumName: schema.forums.name,
    })
    .from(schema.posts)
    .innerJoin(schema.threads, eq(schema.threads.id, schema.posts.threadId))
    .innerJoin(schema.forums, eq(schema.forums.id, schema.threads.forumId))
    .where(
      and(
        eq(schema.forums.isStaffOnly, false),
        sql`(${contains(schema.threads.title, pattern)} OR ${contains(schema.posts.bodyHtml, pattern)})`,
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

export const searchSite = (rawPhrase: string) => {
  const phrase = rawPhrase.trim();
  if (phrase.length < MINIMUM_SEARCH_LENGTH) {
    return { phrase, news: [], pages: [], forum: [] };
  }
  const pattern = likePattern(phrase);
  return {
    phrase,
    news: searchNews(phrase, pattern),
    pages: searchPages(phrase, pattern),
    forum: searchForum(phrase, pattern),
  };
};
