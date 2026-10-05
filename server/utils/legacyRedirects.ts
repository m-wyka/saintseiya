import { and, eq } from 'drizzle-orm';
import type { SQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core';
import type { LegacyTarget } from '#shared/utils/legacyUrls';
import { LEGACY_MEDIA_FOLDER, routes } from '#shared/utils/routes';
import { schema, useDb } from './db';

const LEGACY_REQUEST_PATTERN = /\.(?:php|html?)$|^\/(?:mapa|kr)\/?$|^\/(?:img|images|downloads|newscenter)\//i;

export const looksLikeLegacyRequest = (pathname: string): boolean => LEGACY_REQUEST_PATTERN.test(pathname);

const valueByLegacyId = <Value>(
  table: SQLiteTable,
  legacyIdColumn: SQLiteColumn,
  valueColumn: SQLiteColumn,
  legacyId: number,
) =>
  (
    useDb().select({ value: valueColumn }).from(table).where(eq(legacyIdColumn, legacyId)).get() as
      { value: Value } | undefined
  )?.value;

const publishedPagePath = (legacyId: number): string | undefined =>
  useDb()
    .select({ path: schema.pages.path })
    .from(schema.pages)
    .where(and(eq(schema.pages.legacyId, legacyId), eq(schema.pages.status, 'published')))
    .get()?.path;

const publishedNewsSlug = (legacyId: number): string | undefined =>
  useDb()
    .select({ slug: schema.news.slug })
    .from(schema.news)
    .where(and(eq(schema.news.legacyId, legacyId), eq(schema.news.status, 'published')))
    .get()?.slug;

const found = <Value>(value: Value | undefined, toUrl: (value: Value) => string, fallback: string): string =>
  value === undefined ? fallback : toUrl(value);

export const resolveLegacyTarget = (target: LegacyTarget): string => {
  switch (target.kind) {
    case 'home':
      return routes.home();
    case 'page':
      return found(publishedPagePath(target.legacyId), routes.page, routes.home());
    case 'news':
      return found(publishedNewsSlug(target.legacyId), routes.news, routes.newsList());
    case 'newsList':
      return routes.newsList();
    case 'newsCategory':
      return found(
        valueByLegacyId<string>(
          schema.newsCategories,
          schema.newsCategories.legacyId,
          schema.newsCategories.slug,
          target.legacyId,
        ),
        routes.newsCategory,
        routes.newsList(),
      );
    case 'forumIndex':
      return routes.forumIndex();
    case 'forum':
      return found(
        valueByLegacyId<string>(schema.forums, schema.forums.legacyId, schema.forums.slug, target.legacyId),
        routes.forum,
        routes.forumIndex(),
      );
    case 'thread':
      return found(
        valueByLegacyId<number>(schema.threads, schema.threads.legacyId, schema.threads.id, target.legacyId),
        routes.thread,
        routes.forumIndex(),
      );
    case 'post':
      return found(
        valueByLegacyId<number>(schema.posts, schema.posts.legacyId, schema.posts.id, target.legacyId),
        routes.post,
        routes.forumIndex(),
      );
    case 'gallery':
      return routes.gallery();
    case 'album':
      return found(
        valueByLegacyId<string>(schema.albums, schema.albums.legacyId, schema.albums.slug, target.legacyId),
        routes.album,
        routes.gallery(),
      );
    case 'photo':
      return found(
        valueByLegacyId<number>(schema.photos, schema.photos.legacyId, schema.photos.id, target.legacyId),
        routes.photo,
        routes.gallery(),
      );
    case 'videos':
      return routes.videos();
    case 'user':
      return found(
        valueByLegacyId<number>(schema.users, schema.users.legacyId, schema.users.id, target.legacyId),
        routes.user,
        routes.home(),
      );
    case 'links':
      return routes.links();
    case 'downloads':
      return routes.downloads();
    case 'search':
      return routes.home();
    case 'map':
      return routes.map(target.slug);
    case 'asset':
      return routes.media(`${LEGACY_MEDIA_FOLDER}/${target.path}`);
  }
};
