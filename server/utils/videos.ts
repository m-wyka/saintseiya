import { asc, count, desc, eq } from 'drizzle-orm';
import { schema, useDb } from './db';
import { pageOffset, paginated } from './pagination';

const VIDEOS_PAGE_SIZE = 12;

export const listVideoCategories = () =>
  useDb()
    .select({
      slug: schema.videoCategories.slug,
      name: schema.videoCategories.name,
      description: schema.videoCategories.description,
      videoCount: count(schema.videos.id),
    })
    .from(schema.videoCategories)
    .leftJoin(schema.videos, eq(schema.videos.categoryId, schema.videoCategories.id))
    .groupBy(schema.videoCategories.id)
    .orderBy(asc(schema.videoCategories.sortOrder), asc(schema.videoCategories.id))
    .all();

export const listVideos = (page: number, categorySlug?: string) => {
  const db = useDb();
  const filter = categorySlug ? eq(schema.videoCategories.slug, categorySlug) : undefined;
  const videos = db
    .select({
      id: schema.videos.id,
      title: schema.videos.title,
      description: schema.videos.description,
      youtubeId: schema.videos.youtubeId,
      createdAt: schema.videos.createdAt,
      categoryName: schema.videoCategories.name,
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
