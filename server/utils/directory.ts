import { asc, desc, eq, sql } from 'drizzle-orm';
import { schema, useDb } from './db';

export const linkDirectory = () => {
  const db = useDb();
  const categories = db.select().from(schema.linkCategories).orderBy(asc(schema.linkCategories.sortOrder)).all();
  const links = db
    .select({
      id: schema.links.id,
      categoryId: schema.links.categoryId,
      title: schema.links.title,
      description: schema.links.description,
      url: schema.links.url,
    })
    .from(schema.links)
    .orderBy(asc(schema.links.title))
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

export const listDownloads = () =>
  useDb()
    .select({
      id: schema.downloads.id,
      title: schema.downloads.title,
      description: schema.downloads.description,
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
