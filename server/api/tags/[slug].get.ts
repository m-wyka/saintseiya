import { and, asc, eq } from 'drizzle-orm';

export default defineEventHandler((event) => {
  const db = useDb();
  const tag = foundOr404(
    db
      .select()
      .from(schema.tags)
      .where(eq(schema.tags.slug, getRouterParam(event, 'slug') ?? ''))
      .get(),
    'Nie znaleziono tagu',
  );
  const pages = db
    .select({ title: schema.pages.title, path: schema.pages.path })
    .from(schema.pageTags)
    .innerJoin(schema.pages, eq(schema.pages.id, schema.pageTags.pageId))
    .where(and(eq(schema.pageTags.tagId, tag.id), eq(schema.pages.status, 'published')))
    .orderBy(asc(schema.pages.title))
    .all();
  return { slug: tag.slug, name: tag.name, pages };
});
