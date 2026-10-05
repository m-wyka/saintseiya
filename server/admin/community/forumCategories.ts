import { asc, count, eq } from 'drizzle-orm';
import { z } from 'zod';
import { forumSortOrderSchema } from './forumInputs';

const inputSchema = z.object({
  name: z.string().trim().min(2, 'VALIDATION.NAME_TOO_SHORT').max(100, 'VALIDATION.NAME_TOO_LONG'),
  sortOrder: forumSortOrderSchema,
});

const hasForums = (categoryId: number): boolean =>
  Boolean(
    useDb().select({ id: schema.forums.id }).from(schema.forums).where(eq(schema.forums.categoryId, categoryId)).get(),
  );

export const forumCategoriesResource = defineAdminResource({
  access: 'forum',
  inputSchema,
  list: () =>
    useDb()
      .select({
        id: schema.forumCategories.id,
        name: schema.forumCategories.name,
        sortOrder: schema.forumCategories.sortOrder,
        forumCount: count(schema.forums.id),
      })
      .from(schema.forumCategories)
      .leftJoin(schema.forums, eq(schema.forums.categoryId, schema.forumCategories.id))
      .groupBy(schema.forumCategories.id)
      .orderBy(asc(schema.forumCategories.sortOrder), asc(schema.forumCategories.id))
      .all(),
  find: (id) => useDb().select().from(schema.forumCategories).where(eq(schema.forumCategories.id, id)).get(),
  create: (input) =>
    useDb().insert(schema.forumCategories).values(input).returning({ id: schema.forumCategories.id }).get(),
  update: (id, input) => {
    useDb().update(schema.forumCategories).set(input).where(eq(schema.forumCategories.id, id)).run();
  },
  remove: (id) => {
    if (hasForums(id)) {
      throw conflict('ERRORS.FORUM_CATEGORY_HAS_FORUMS');
    }
    useDb().delete(schema.forumCategories).where(eq(schema.forumCategories.id, id)).run();
  },
});
