import { and, asc, count, desc, eq, gt, lt, or, sql } from 'drizzle-orm';
import type { ContentLocale } from '#shared/utils/locales';
import { DEFAULT_LOCALE } from '#shared/utils/locales';
import { authorColumns } from './authors';
import { schema, useDb } from './db';
import { pageOffset, paginated } from './pagination';

const PHOTOS_PAGE_SIZE = 24;

const photoOrder = [asc(schema.photos.sortOrder), asc(schema.photos.id)];

export const listAlbums = (locale: ContentLocale = DEFAULT_LOCALE) =>
  useDb()
    .select({
      slug: schema.albums.slug,
      title: localized(schema.albums.title, locale),
      description: localized(schema.albums.description, locale),
      coverImage: localized(schema.albums.coverImage, locale),
      photoCount: count(schema.photos.id),
    })
    .from(schema.albums)
    .leftJoin(schema.photos, eq(schema.photos.albumId, schema.albums.id))
    .groupBy(schema.albums.id)
    .orderBy(asc(schema.albums.sortOrder), asc(schema.albums.id))
    .all();

export const albumPhotos = (slug: string, page: number, locale: ContentLocale = DEFAULT_LOCALE) => {
  const db = useDb();
  const album = db
    .select({
      id: schema.albums.id,
      slug: schema.albums.slug,
      title: localized(schema.albums.title, locale),
      description: localized(schema.albums.description, locale),
    })
    .from(schema.albums)
    .where(eq(schema.albums.slug, slug))
    .get();
  if (!album) {
    return null;
  }
  const photos = db
    .select({
      id: schema.photos.id,
      title: localized(schema.photos.title, locale),
      thumbnail: schema.photos.thumbnail,
      width: schema.photos.width,
      height: schema.photos.height,
    })
    .from(schema.photos)
    .where(eq(schema.photos.albumId, album.id))
    .orderBy(...photoOrder)
    .limit(PHOTOS_PAGE_SIZE)
    .offset(pageOffset(page, PHOTOS_PAGE_SIZE))
    .all();
  const total =
    db.select({ total: count() }).from(schema.photos).where(eq(schema.photos.albumId, album.id)).get()?.total ?? 0;
  return { album, photos: paginated(photos, total, page, PHOTOS_PAGE_SIZE) };
};

const neighbourPhotoId = (albumId: number, sortOrder: number, photoId: number, direction: 'previous' | 'next') => {
  const isNext = direction === 'next';
  const compare = isNext ? gt : lt;
  return (
    useDb()
      .select({ id: schema.photos.id })
      .from(schema.photos)
      .where(
        and(
          eq(schema.photos.albumId, albumId),
          or(
            compare(schema.photos.sortOrder, sortOrder),
            and(eq(schema.photos.sortOrder, sortOrder), compare(schema.photos.id, photoId)),
          ),
        ),
      )
      .orderBy(...(isNext ? photoOrder : [desc(schema.photos.sortOrder), desc(schema.photos.id)]))
      .limit(1)
      .get()?.id ?? null
  );
};

export const findPhoto = (photoId: number, locale: ContentLocale = DEFAULT_LOCALE) => {
  const photo = useDb()
    .select({
      id: schema.photos.id,
      albumId: schema.photos.albumId,
      sortOrder: schema.photos.sortOrder,
      title: localized(schema.photos.title, locale),
      description: localized(schema.photos.description, locale),
      image: schema.photos.image,
      width: schema.photos.width,
      height: schema.photos.height,
      viewCount: schema.photos.viewCount,
      createdAt: schema.photos.createdAt,
      album: { slug: schema.albums.slug, title: localized(schema.albums.title, locale) },
      author: authorColumns,
    })
    .from(schema.photos)
    .innerJoin(schema.albums, eq(schema.albums.id, schema.photos.albumId))
    .leftJoin(schema.users, eq(schema.users.id, schema.photos.authorId))
    .where(eq(schema.photos.id, photoId))
    .get();
  if (!photo) {
    return null;
  }
  const { albumId, sortOrder, ...details } = photo;
  return {
    ...details,
    previousPhotoId: neighbourPhotoId(albumId, sortOrder, photo.id, 'previous'),
    nextPhotoId: neighbourPhotoId(albumId, sortOrder, photo.id, 'next'),
  };
};

export const countPhotoView = (photoId: number) => {
  useDb()
    .update(schema.photos)
    .set({ viewCount: sql`${schema.photos.viewCount} + 1` })
    .where(eq(schema.photos.id, photoId))
    .run();
};
