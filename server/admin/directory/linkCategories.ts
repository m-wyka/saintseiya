import { asc, count, eq } from 'drizzle-orm';
import { z } from 'zod';
import { sortOrderSchema } from './inputs';

const inputSchema = z.object({
  name: z.string().trim().min(2, 'VALIDATION.NAME_TOO_SHORT').max(100, 'VALIDATION.NAME_TOO_LONG'),
  sortOrder: sortOrderSchema,
});

const hasLinks = (categoryId: number): boolean =>
  Boolean(
    useDb().select({ id: schema.links.id }).from(schema.links).where(eq(schema.links.categoryId, categoryId)).get(),
  );

export const linkCategoriesResource = defineAdminResource({
  access: 'links',
  inputSchema,
  translatable: {
    table: schema.linkCategories,
    fields: { name: 'text' },
  },
  list: () =>
    useDb()
      .select({
        id: schema.linkCategories.id,
        name: schema.linkCategories.name,
        sortOrder: schema.linkCategories.sortOrder,
        linkCount: count(schema.links.id),
      })
      .from(schema.linkCategories)
      .leftJoin(schema.links, eq(schema.links.categoryId, schema.linkCategories.id))
      .groupBy(schema.linkCategories.id)
      .orderBy(asc(schema.linkCategories.sortOrder), asc(schema.linkCategories.id))
      .all(),
  find: (id) => useDb().select().from(schema.linkCategories).where(eq(schema.linkCategories.id, id)).get(),
  create: (input) =>
    useDb().insert(schema.linkCategories).values(input).returning({ id: schema.linkCategories.id }).get(),
  update: (id, input) => {
    useDb().update(schema.linkCategories).set(input).where(eq(schema.linkCategories.id, id)).run();
  },
  remove: (id) => {
    if (hasLinks(id)) {
      throw conflict('ERRORS.LINK_CATEGORY_HAS_LINKS');
    }
    useDb().delete(schema.linkCategories).where(eq(schema.linkCategories.id, id)).run();
  },
});
