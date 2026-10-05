import { and, count, desc, eq, inArray, sql } from 'drizzle-orm';
import type { ContentLocale } from '#shared/utils/locales';
import { DEFAULT_LOCALE } from '#shared/utils/locales';
import { authorColumns } from './authors';
import { schema, useDb } from './db';
import { pageOffset, paginated } from './pagination';
import { qualified } from './sqlHelpers';
import { localized } from './translations';

const NEWS_PAGE_SIZE = 9;
const TEASER_LENGTH = 260;

const teaserOf = (excerptHtml: string, bodyHtml: string): string => {
  const text = htmlToPlainText(excerptHtml) || htmlToPlainText(bodyHtml);
  if (text.length <= TEASER_LENGTH) {
    return text;
  }
  const cut = text.slice(0, TEASER_LENGTH);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : TEASER_LENGTH).replace(/[\s.,;:!?–-]+$/, '')}…`;
};

interface NewsFilters {
  page: number;
  categorySlug?: string;
  tagSlug?: string;
}

const visibleCommentCount = sql<number>`(
  SELECT COUNT(*) FROM ${schema.comments}
  WHERE ${qualified(schema.comments.targetKind)} = 'news'
    AND ${qualified(schema.comments.targetId)} = ${qualified(schema.news.id)}
    AND ${qualified(schema.comments.isHidden)} = 0
)`;

const categoryColumns = (locale: ContentLocale) => ({
  slug: schema.newsCategories.slug,
  name: localized(schema.newsCategories.name, locale),
  image: localized(schema.newsCategories.image, locale),
});

const newsIdsWithTag = (tagSlug: string) =>
  useDb()
    .select({ newsId: schema.newsTags.newsId })
    .from(schema.newsTags)
    .innerJoin(schema.tags, eq(schema.tags.id, schema.newsTags.tagId))
    .where(eq(schema.tags.slug, tagSlug));

const publishedNewsFilter = ({ categorySlug, tagSlug }: Omit<NewsFilters, 'page'>) =>
  and(
    eq(schema.news.status, 'published'),
    categorySlug ? eq(schema.newsCategories.slug, categorySlug) : undefined,
    tagSlug ? inArray(schema.news.id, newsIdsWithTag(tagSlug)) : undefined,
  );

export const listPublishedNews = (
  filters: NewsFilters,
  pageSize = NEWS_PAGE_SIZE,
  locale: ContentLocale = DEFAULT_LOCALE,
) => {
  const db = useDb();
  const filter = publishedNewsFilter(filters);
  const items = db
    .select({
      slug: schema.news.slug,
      title: localized(schema.news.title, locale),
      excerptHtml: localized(schema.news.excerptHtml, locale),
      bodyHtml: localized(schema.news.bodyHtml, locale),
      publishedAt: schema.news.publishedAt,
      commentCount: visibleCommentCount,
      category: categoryColumns(locale),
      author: authorColumns,
    })
    .from(schema.news)
    .innerJoin(schema.users, eq(schema.users.id, schema.news.authorId))
    .leftJoin(schema.newsCategories, eq(schema.newsCategories.id, schema.news.categoryId))
    .where(filter)
    .orderBy(desc(schema.news.publishedAt), desc(schema.news.id))
    .limit(pageSize)
    .offset(pageOffset(filters.page, pageSize))
    .all();
  const total =
    db
      .select({ total: count() })
      .from(schema.news)
      .leftJoin(schema.newsCategories, eq(schema.newsCategories.id, schema.news.categoryId))
      .where(filter)
      .get()?.total ?? 0;
  const summaries = items.map(({ excerptHtml, bodyHtml, ...item }) => ({
    ...item,
    teaser: teaserOf(excerptHtml, bodyHtml),
  }));
  return paginated(summaries, total, filters.page, pageSize);
};

const tagsOfNews = (newsId: number, locale: ContentLocale) =>
  useDb()
    .select({ slug: schema.tags.slug, name: localized(schema.tags.name, locale) })
    .from(schema.newsTags)
    .innerJoin(schema.tags, eq(schema.tags.id, schema.newsTags.tagId))
    .where(eq(schema.newsTags.newsId, newsId))
    .orderBy(localized(schema.tags.name, locale))
    .all();

export const findPublishedNews = (slug: string, locale: ContentLocale = DEFAULT_LOCALE) => {
  const news = useDb()
    .select({
      id: schema.news.id,
      slug: schema.news.slug,
      title: localized(schema.news.title, locale),
      excerptHtml: localized(schema.news.excerptHtml, locale),
      bodyHtml: localized(schema.news.bodyHtml, locale),
      publishedAt: schema.news.publishedAt,
      commentsEnabled: schema.news.commentsEnabled,
      viewCount: schema.news.viewCount,
      category: categoryColumns(locale),
      author: authorColumns,
    })
    .from(schema.news)
    .innerJoin(schema.users, eq(schema.users.id, schema.news.authorId))
    .leftJoin(schema.newsCategories, eq(schema.newsCategories.id, schema.news.categoryId))
    .where(and(eq(schema.news.slug, slug), eq(schema.news.status, 'published')))
    .get();
  if (!news) {
    return null;
  }
  return {
    ...news,
    excerptHtml: markMissingImages(news.excerptHtml),
    bodyHtml: markMissingImages(news.bodyHtml),
    tags: tagsOfNews(news.id, locale),
  };
};

export const countNewsView = (newsId: number) => {
  useDb()
    .update(schema.news)
    .set({ viewCount: sql`${schema.news.viewCount} + 1` })
    .where(eq(schema.news.id, newsId))
    .run();
};

export const listNewsCategories = (locale: ContentLocale = DEFAULT_LOCALE) =>
  useDb()
    .select({
      slug: schema.newsCategories.slug,
      name: localized(schema.newsCategories.name, locale),
      image: localized(schema.newsCategories.image, locale),
      newsCount: count(schema.news.id),
    })
    .from(schema.newsCategories)
    .leftJoin(
      schema.news,
      and(eq(schema.news.categoryId, schema.newsCategories.id), eq(schema.news.status, 'published')),
    )
    .groupBy(schema.newsCategories.id)
    .orderBy(desc(count(schema.news.id)), localized(schema.newsCategories.name, locale))
    .all();
