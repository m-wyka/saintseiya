import { and, asc, eq, ne } from 'drizzle-orm';
import { z } from 'zod';
import { forumSortOrderSchema } from './forumInputs';

const UNKNOWN_CATEGORY = 'VALIDATION.FORUM_CATEGORY_REQUIRED';

const categoryExists = (categoryId: number): boolean =>
  Boolean(
    useDb()
      .select({ id: schema.forumCategories.id })
      .from(schema.forumCategories)
      .where(eq(schema.forumCategories.id, categoryId))
      .get(),
  );

const inputSchema = z.object({
  categoryId: z.number(UNKNOWN_CATEGORY).refine(categoryExists, UNKNOWN_CATEGORY),
  name: z.string().trim().min(2, 'VALIDATION.NAME_TOO_SHORT').max(100, 'VALIDATION.NAME_TOO_LONG'),
  slug: slugInputSchema,
  description: z.string().trim().max(300, 'VALIDATION.DESCRIPTION_TOO_LONG').default(''),
  isStaffOnly: z.boolean().default(false),
  sortOrder: forumSortOrderSchema,
});

type ForumInput = z.infer<typeof inputSchema>;

const isSlugTaken = (slug: string, exceptId?: number): boolean =>
  Boolean(
    useDb()
      .select({ id: schema.forums.id })
      .from(schema.forums)
      .where(and(eq(schema.forums.slug, slug), exceptId ? ne(schema.forums.id, exceptId) : undefined))
      .get(),
  );

const hasThreads = (forumId: number): boolean =>
  Boolean(
    useDb().select({ id: schema.threads.id }).from(schema.threads).where(eq(schema.threads.forumId, forumId)).get(),
  );

const storedValues = ({ slug, ...input }: ForumInput, exceptId?: number) => ({
  ...input,
  slug: adminSlug(slug, input.name, (candidate) => isSlugTaken(candidate, exceptId), 'dzial'),
});

export const forumsResource = defineAdminResource({
  access: 'forum',
  inputSchema,
  translatable: {
    table: schema.forums,
    fields: { name: 'text', description: 'text' },
  },
  list: () =>
    useDb()
      .select({
        id: schema.forums.id,
        name: schema.forums.name,
        slug: schema.forums.slug,
        categoryName: schema.forumCategories.name,
        isStaffOnly: schema.forums.isStaffOnly,
        sortOrder: schema.forums.sortOrder,
        threadCount: schema.forums.threadCount,
        postCount: schema.forums.postCount,
      })
      .from(schema.forums)
      .innerJoin(schema.forumCategories, eq(schema.forumCategories.id, schema.forums.categoryId))
      .orderBy(
        asc(schema.forumCategories.sortOrder),
        asc(schema.forumCategories.id),
        asc(schema.forums.sortOrder),
        asc(schema.forums.id),
      )
      .all(),
  find: (id) => useDb().select().from(schema.forums).where(eq(schema.forums.id, id)).get(),
  create: (input) =>
    useDb().insert(schema.forums).values(storedValues(input)).returning({ id: schema.forums.id }).get(),
  update: (id, input) => {
    useDb().update(schema.forums).set(storedValues(input, id)).where(eq(schema.forums.id, id)).run();
  },
  remove: (id) => {
    if (hasThreads(id)) {
      throw conflict('ERRORS.FORUM_HAS_THREADS');
    }
    useDb().delete(schema.forums).where(eq(schema.forums.id, id)).run();
  },
});
