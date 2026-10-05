import { asc, desc, eq, sql } from 'drizzle-orm';
import type { ContentLocale } from '#shared/utils/locales';
import { DEFAULT_LOCALE } from '#shared/utils/locales';
import { schema, useDb } from './db';

export const linkDirectory = (locale: ContentLocale = DEFAULT_LOCALE) => {
  const db = useDb();
  const categories = db
    .select({ id: schema.linkCategories.id, name: localized(schema.linkCategories.name, locale) })
    .from(schema.linkCategories)
    .orderBy(asc(schema.linkCategories.sortOrder))
    .all();
  const links = db
    .select({
      id: schema.links.id,
      categoryId: schema.links.categoryId,
      title: localized(schema.links.title, locale),
      description: localized(schema.links.description, locale),
      url: schema.links.url,
    })
    .from(schema.links)
    .orderBy(asc(localized(schema.links.title, locale)))
    .all();
  const linksByCategory = Map.groupBy(links, (link) => link.categoryId);
  return categories
    .map((category) => ({
      id: category.id,
      name: category.name,
      links: (linksByCategory.get(category.id) ?? []).map(({ categoryId: _categoryId, ...link }) => link),
    }))
    .filter((category) => category.links.length > 0);
};

export const listDownloads = (locale: ContentLocale = DEFAULT_LOCALE) =>
  useDb()
    .select({
      id: schema.downloads.id,
      title: localized(schema.downloads.title, locale),
      description: localized(schema.downloads.description, locale),
      fileSize: schema.downloads.fileSize,
      downloadCount: schema.downloads.downloadCount,
      createdAt: schema.downloads.createdAt,
    })
    .from(schema.downloads)
    .orderBy(desc(schema.downloads.createdAt))
    .all();

export const registerDownload = (downloadId: number): string | null => {
  const db = useDb();
  const download = db
    .select({ file: schema.downloads.file })
    .from(schema.downloads)
    .where(eq(schema.downloads.id, downloadId))
    .get();
  if (!download) {
    return null;
  }
  db.update(schema.downloads)
    .set({ downloadCount: sql`${schema.downloads.downloadCount} + 1` })
    .where(eq(schema.downloads.id, downloadId))
    .run();
  return download.file;
};
