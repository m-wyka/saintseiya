import { and, asc, eq } from 'drizzle-orm';

export default defineEventHandler((event) => {
  const db = useDb();
  const locale = contentLocaleOf(event);
  const tag = foundOr404(
    db
      .select({ id: schema.tags.id, slug: schema.tags.slug, name: localized(schema.tags.name, locale) })
      .from(schema.tags)
      .where(eq(schema.tags.slug, getRouterParam(event, 'slug') ?? ''))
      .get(),
    'ERRORS.TAG_NOT_FOUND',
  );
  const pages = db
    .select({ title: localized(schema.pages.title, locale), path: schema.pages.path })
    .from(schema.pageTags)
    .innerJoin(schema.pages, eq(schema.pages.id, schema.pageTags.pageId))
    .where(and(eq(schema.pageTags.tagId, tag.id), eq(schema.pages.status, 'published')))
    .orderBy(asc(localized(schema.pages.title, locale)))
    .all();
  return { slug: tag.slug, name: tag.name, pages };
});
