import { asc, count, desc, eq } from 'drizzle-orm';
import type { ContentLocale } from '#shared/utils/locales';
import { DEFAULT_LOCALE } from '#shared/utils/locales';
import { schema, useDb } from './db';
import { pageOffset, paginated } from './pagination';

const VIDEOS_PAGE_SIZE = 12;

export const listVideoCategories = (locale: ContentLocale = DEFAULT_LOCALE) =>
  useDb()
    .select({
      slug: schema.videoCategories.slug,
      name: localized(schema.videoCategories.name, locale),
      description: localized(schema.videoCategories.description, locale),
      videoCount: count(schema.videos.id),
    })
    .from(schema.videoCategories)
    .leftJoin(schema.videos, eq(schema.videos.categoryId, schema.videoCategories.id))
    .groupBy(schema.videoCategories.id)
    .orderBy(asc(schema.videoCategories.sortOrder), asc(schema.videoCategories.id))
    .all();

export const listVideos = (page: number, categorySlug?: string, locale: ContentLocale = DEFAULT_LOCALE) => {
  const db = useDb();
  const filter = categorySlug ? eq(schema.videoCategories.slug, categorySlug) : undefined;
  const videos = db
    .select({
      id: schema.videos.id,
      title: localized(schema.videos.title, locale),
      description: localized(schema.videos.description, locale),
      youtubeId: schema.videos.youtubeId,
      createdAt: schema.videos.createdAt,
      categoryName: localized(schema.videoCategories.name, locale),
    })
    .from(schema.videos)
    .innerJoin(schema.videoCategories, eq(schema.videoCategories.id, schema.videos.categoryId))
    .where(filter)
    .orderBy(desc(schema.videos.createdAt), desc(schema.videos.id))
    .limit(VIDEOS_PAGE_SIZE)
    .offset(pageOffset(page, VIDEOS_PAGE_SIZE))
    .all();
  const total =
    db
      .select({ total: count() })
      .from(schema.videos)
      .innerJoin(schema.videoCategories, eq(schema.videoCategories.id, schema.videos.categoryId))
      .where(filter)
      .get()?.total ?? 0;
  return paginated(videos, total, page, VIDEOS_PAGE_SIZE);
};
