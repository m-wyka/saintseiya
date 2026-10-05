import { and, count, desc, eq, inArray, sql } from 'drizzle-orm';
import { authorColumns } from './authors';
import { schema, useDb } from './db';
import { pageOffset, paginated } from './pagination';
import { qualified } from './sqlHelpers';

const NEWS_PAGE_SIZE = 9;

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

const categoryColumns = {
  slug: schema.newsCategories.slug,
  name: schema.newsCategories.name,
  image: schema.newsCategories.image,
};

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

export const listPublishedNews = (filters: NewsFilters, pageSize = NEWS_PAGE_SIZE) => {
  const db = useDb();
  const filter = publishedNewsFilter(filters);
  const items = db
    .select({
      slug: schema.news.slug,
      title: schema.news.title,
      excerptHtml: schema.news.excerptHtml,
      hasBody: sql<boolean>`${schema.news.bodyHtml} <> ''`.mapWith(Boolean),
      publishedAt: schema.news.publishedAt,
      commentCount: visibleCommentCount,
      category: categoryColumns,
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
  const readableItems = items.map((item) => ({ ...item, excerptHtml: markMissingImages(item.excerptHtml) }));
  return paginated(readableItems, total, filters.page, pageSize);
};

const tagsOfNews = (newsId: number) =>
  useDb()
    .select({ slug: schema.tags.slug, name: schema.tags.name })
    .from(schema.newsTags)
    .innerJoin(schema.tags, eq(schema.tags.id, schema.newsTags.tagId))
    .where(eq(schema.newsTags.newsId, newsId))
    .orderBy(schema.tags.name)
    .all();

export const findPublishedNews = (slug: string) => {
  const news = useDb()
    .select({
      id: schema.news.id,
      slug: schema.news.slug,
      title: schema.news.title,
      excerptHtml: schema.news.excerptHtml,
      bodyHtml: schema.news.bodyHtml,
      publishedAt: schema.news.publishedAt,
      commentsEnabled: schema.news.commentsEnabled,
      viewCount: schema.news.viewCount,
      category: categoryColumns,
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
    tags: tagsOfNews(news.id),
  };
};

export const countNewsView = (newsId: number) => {
  useDb()
    .update(schema.news)
    .set({ viewCount: sql`${schema.news.viewCount} + 1` })
    .where(eq(schema.news.id, newsId))
    .run();
};

export const listNewsCategories = () =>
  useDb()
    .select({
      slug: schema.newsCategories.slug,
      name: schema.newsCategories.name,
      image: schema.newsCategories.image,
      newsCount: count(schema.news.id),
    })
    .from(schema.newsCategories)
    .leftJoin(
      schema.news,
      and(eq(schema.news.categoryId, schema.newsCategories.id), eq(schema.news.status, 'published')),
    )
    .groupBy(schema.newsCategories.id)
    .orderBy(desc(count(schema.news.id)), schema.newsCategories.name)
    .all();
