import { asc, count, eq, like, or } from 'drizzle-orm';
import { z } from 'zod';
import { existingIdSchema, isWebUrl } from './inputs';

const LINKS_PAGE_SIZE = 20;

const categoryExists = (categoryId: number): boolean =>
  Boolean(
    useDb()
      .select({ id: schema.linkCategories.id })
      .from(schema.linkCategories)
      .where(eq(schema.linkCategories.id, categoryId))
      .get(),
  );

const inputSchema = z.object({
  title: z.string().trim().min(2, 'VALIDATION.TITLE_TOO_SHORT').max(200, 'VALIDATION.TITLE_TOO_LONG'),
  description: z.string().trim().max(1000, 'VALIDATION.DESCRIPTION_TOO_LONG').default(''),
  url: z.string().trim().max(500, 'VALIDATION.URL_TOO_LONG').refine(isWebUrl, 'VALIDATION.WEB_URL_REQUIRED'),
  categoryId: existingIdSchema(categoryExists, 'VALIDATION.CATEGORY_REQUIRED'),
});

export const linksResource = defineAdminResource({
  access: 'links',
  inputSchema,
  translatable: {
    table: schema.links,
    fields: { title: 'text', description: 'text' },
  },
  list: ({ page, search }) => {
    const db = useDb();
    const where = search
      ? or(like(schema.links.title, `%${search}%`), like(schema.links.url, `%${search}%`))
      : undefined;
    const items = db
      .select({
        id: schema.links.id,
        title: schema.links.title,
        url: schema.links.url,
        categoryName: schema.linkCategories.name,
      })
      .from(schema.links)
      .innerJoin(schema.linkCategories, eq(schema.linkCategories.id, schema.links.categoryId))
      .where(where)
      .orderBy(asc(schema.linkCategories.sortOrder), asc(schema.links.title), asc(schema.links.id))
      .limit(LINKS_PAGE_SIZE)
      .offset(pageOffset(page, LINKS_PAGE_SIZE))
      .all();
    const total = db.select({ total: count() }).from(schema.links).where(where).get()?.total ?? 0;
    return paginated(items, total, page, LINKS_PAGE_SIZE);
  },
  find: (id) => useDb().select().from(schema.links).where(eq(schema.links.id, id)).get(),
  create: (input) => useDb().insert(schema.links).values(input).returning({ id: schema.links.id }).get(),
  update: (id, input) => {
    useDb().update(schema.links).set(input).where(eq(schema.links.id, id)).run();
  },
  remove: (id) => {
    useDb().delete(schema.links).where(eq(schema.links.id, id)).run();
  },
});
