import { asc, count, eq } from 'drizzle-orm';
import { z } from 'zod';
import { sortOrderSchema } from './inputs';

const inputSchema = z.object({
  name: z.string().trim().min(2, 'VALIDATION.NAME_TOO_SHORT').max(100, 'VALIDATION.NAME_TOO_LONG'),
  sortOrder: sortOrderSchema,
});

const hasItems = (categoryId: number): boolean =>
  Boolean(
    useDb()
      .select({ id: schema.faqItems.id })
      .from(schema.faqItems)
      .where(eq(schema.faqItems.categoryId, categoryId))
      .get(),
  );

export const faqCategoriesResource = defineAdminResource({
  access: 'pages',
  inputSchema,
  translatable: {
    table: schema.faqCategories,
    fields: { name: 'text' },
  },
  list: () =>
    useDb()
      .select({
        id: schema.faqCategories.id,
        name: schema.faqCategories.name,
        sortOrder: schema.faqCategories.sortOrder,
        itemCount: count(schema.faqItems.id),
      })
      .from(schema.faqCategories)
      .leftJoin(schema.faqItems, eq(schema.faqItems.categoryId, schema.faqCategories.id))
      .groupBy(schema.faqCategories.id)
      .orderBy(asc(schema.faqCategories.sortOrder), asc(schema.faqCategories.id))
      .all(),
  find: (id) => useDb().select().from(schema.faqCategories).where(eq(schema.faqCategories.id, id)).get(),
  create: (input) =>
    useDb().insert(schema.faqCategories).values(input).returning({ id: schema.faqCategories.id }).get(),
  update: (id, input) => {
    useDb().update(schema.faqCategories).set(input).where(eq(schema.faqCategories.id, id)).run();
  },
  remove: (id) => {
    if (hasItems(id)) {
      throw conflict('ERRORS.FAQ_CATEGORY_HAS_ITEMS');
    }
    useDb().delete(schema.faqCategories).where(eq(schema.faqCategories.id, id)).run();
  },
});
