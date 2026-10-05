import { and, asc, count, eq, like } from 'drizzle-orm';
import { z } from 'zod';
import { existingIdSchema, sortOrderSchema } from './inputs';

const FAQ_ITEMS_PAGE_SIZE = 20;

const categoryExists = (categoryId: number): boolean =>
  Boolean(
    useDb()
      .select({ id: schema.faqCategories.id })
      .from(schema.faqCategories)
      .where(eq(schema.faqCategories.id, categoryId))
      .get(),
  );

const inputSchema = z.object({
  title: z.string().trim().min(2, 'VALIDATION.TITLE_TOO_SHORT').max(300, 'VALIDATION.TITLE_TOO_LONG'),
  descriptionHtml: richBodySchema.default(''),
  categoryId: existingIdSchema(categoryExists, 'VALIDATION.CATEGORY_REQUIRED'),
  sortOrder: sortOrderSchema,
});

type FaqItemInput = z.infer<typeof inputSchema>;

const storedValues = (input: FaqItemInput) => ({
  ...input,
  descriptionHtml: cleanEditorHtml(input.descriptionHtml),
});

export const faqItemsResource = defineAdminResource({
  access: 'pages',
  inputSchema,
  translatable: {
    table: schema.faqItems,
    fields: { title: 'text', descriptionHtml: 'html' },
  },
  list: ({ page, search, filter }) => {
    const db = useDb();
    const where = and(
      search ? like(schema.faqItems.title, `%${search}%`) : undefined,
      Number(filter) ? eq(schema.faqItems.categoryId, Number(filter)) : undefined,
    );
    const items = db
      .select({
        id: schema.faqItems.id,
        title: schema.faqItems.title,
        categoryName: schema.faqCategories.name,
        sortOrder: schema.faqItems.sortOrder,
      })
      .from(schema.faqItems)
      .innerJoin(schema.faqCategories, eq(schema.faqCategories.id, schema.faqItems.categoryId))
      .where(where)
      .orderBy(
        asc(schema.faqCategories.sortOrder),
        asc(schema.faqCategories.id),
        asc(schema.faqItems.sortOrder),
        asc(schema.faqItems.id),
      )
      .limit(FAQ_ITEMS_PAGE_SIZE)
      .offset(pageOffset(page, FAQ_ITEMS_PAGE_SIZE))
      .all();
    const total = db.select({ total: count() }).from(schema.faqItems).where(where).get()?.total ?? 0;
    return paginated(items, total, page, FAQ_ITEMS_PAGE_SIZE);
  },
  find: (id) => useDb().select().from(schema.faqItems).where(eq(schema.faqItems.id, id)).get(),
  create: (input) =>
    useDb().insert(schema.faqItems).values(storedValues(input)).returning({ id: schema.faqItems.id }).get(),
  update: (id, input) => {
    useDb().update(schema.faqItems).set(storedValues(input)).where(eq(schema.faqItems.id, id)).run();
  },
  remove: (id) => {
    useDb().delete(schema.faqItems).where(eq(schema.faqItems.id, id)).run();
  },
});
