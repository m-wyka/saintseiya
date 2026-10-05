import { and, asc, count, eq, ne } from 'drizzle-orm';
import { z } from 'zod';

const inputSchema = z.object({
  name: z.string().trim().min(2, 'VALIDATION.NAME_TOO_SHORT').max(100),
  slug: slugInputSchema,
  image: z.string().trim().max(300).nullable().default(null),
});

const isSlugTaken = (slug: string, exceptId?: number): boolean =>
  Boolean(
    useDb()
      .select({ id: schema.newsCategories.id })
      .from(schema.newsCategories)
      .where(and(eq(schema.newsCategories.slug, slug), exceptId ? ne(schema.newsCategories.id, exceptId) : undefined))
      .get(),
  );

export const newsCategoriesResource = defineAdminResource({
  access: 'news',
  inputSchema,
  translatable: {
    table: schema.newsCategories,
    fields: { name: 'text', image: 'text' },
  },
  list: () =>
    useDb()
      .select({
        id: schema.newsCategories.id,
        name: schema.newsCategories.name,
        slug: schema.newsCategories.slug,
        image: schema.newsCategories.image,
        newsCount: count(schema.news.id),
      })
      .from(schema.newsCategories)
      .leftJoin(schema.news, eq(schema.news.categoryId, schema.newsCategories.id))
      .groupBy(schema.newsCategories.id)
      .orderBy(asc(schema.newsCategories.name))
      .all(),
  find: (id) => useDb().select().from(schema.newsCategories).where(eq(schema.newsCategories.id, id)).get(),
  create: (input) =>
    useDb()
      .insert(schema.newsCategories)
      .values({
        name: input.name,
        image: input.image,
        slug: adminSlug(input.slug, input.name, (candidate) => isSlugTaken(candidate), 'kategoria'),
      })
      .returning({ id: schema.newsCategories.id })
      .get(),
  update: (id, input) => {
    useDb()
      .update(schema.newsCategories)
      .set({
        name: input.name,
        image: input.image,
        slug: adminSlug(input.slug, input.name, (candidate) => isSlugTaken(candidate, id), 'kategoria'),
      })
      .where(eq(schema.newsCategories.id, id))
      .run();
  },
  remove: (id) => {
    useDb().delete(schema.newsCategories).where(eq(schema.newsCategories.id, id)).run();
  },
});
