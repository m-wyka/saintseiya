import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import type { ContentLocale } from '#shared/utils/locales';
import { DEFAULT_LOCALE } from '#shared/utils/locales';
import { schema, useDb } from './db';
import { qualified } from './sqlHelpers';
import { localized } from './translations';

const ancestorPaths = (path: string): string[] => {
  const segments = path.split('/');
  return segments.slice(1).map((_, index) => segments.slice(0, index + 1).join('/'));
};

const breadcrumbsOf = (path: string, locale: ContentLocale) => {
  const paths = ancestorPaths(path);
  if (!paths.length) {
    return [];
  }
  return useDb()
    .select({ title: localized(schema.pages.title, locale), path: schema.pages.path })
    .from(schema.pages)
    .where(inArray(schema.pages.path, paths))
    .orderBy(sql`LENGTH(${schema.pages.path})`)
    .all();
};

const publishedChildrenOf = (pageId: number, locale: ContentLocale) => {
  const publishedGrandchildCount = sql<number>`(
    SELECT COUNT(*) FROM ${schema.pages} AS grandchildren
    WHERE grandchildren.parent_id = ${qualified(schema.pages.id)} AND grandchildren.status = 'published'
  )`;
  return useDb()
    .select({
      title: localized(schema.pages.title, locale),
      path: schema.pages.path,
      kind: schema.pages.kind,
      childCount: publishedGrandchildCount,
    })
    .from(schema.pages)
    .where(and(eq(schema.pages.parentId, pageId), eq(schema.pages.status, 'published')))
    .orderBy(asc(schema.pages.sortOrder), asc(schema.pages.id))
    .all();
};

export const findPublishedPage = (path: string, locale: ContentLocale = DEFAULT_LOCALE) => {
  const page = useDb()
    .select({
      id: schema.pages.id,
      path: schema.pages.path,
      title: localized(schema.pages.title, locale),
      kind: schema.pages.kind,
      bodyHtml: localized(schema.pages.bodyHtml, locale),
      commentsEnabled: schema.pages.commentsEnabled,
      updatedAt: schema.pages.updatedAt,
    })
    .from(schema.pages)
    .where(and(eq(schema.pages.path, path), eq(schema.pages.status, 'published')))
    .get();
  if (!page) {
    return null;
  }
  return {
    ...page,
    bodyHtml: markMissingImages(page.bodyHtml),
    breadcrumbs: breadcrumbsOf(page.path, locale),
    children: publishedChildrenOf(page.id, locale),
  };
};
