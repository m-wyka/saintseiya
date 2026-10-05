import { and, count, desc, eq, like, ne } from 'drizzle-orm';
import { z } from 'zod';
import { CONTENT_STATUSES } from '#shared/utils/content';

const NEWS_PAGE_SIZE = 20;

const inputSchema = z.object({
  title: z.string().trim().min(3, 'VALIDATION.TITLE_TOO_SHORT').max(200),
  slug: slugInputSchema,
  categoryId: z.number().int().positive().nullable(),
  tagIds: z.array(z.number().int().positive()).max(30).default([]),
  excerptHtml: richBodySchema,
  bodyHtml: richBodySchema.default(''),
  status: z.enum(CONTENT_STATUSES),
  commentsEnabled: z.boolean(),
  publishedAt: z.coerce.date().nullable().default(null),
});

type NewsInput = z.infer<typeof inputSchema>;

const isSlugTaken = (slug: string, exceptId?: number): boolean =>
  slug === 'kategoria' ||
  Boolean(
    useDb()
      .select({ id: schema.news.id })
      .from(schema.news)
      .where(and(eq(schema.news.slug, slug), exceptId ? ne(schema.news.id, exceptId) : undefined))
      .get(),
  );

const replaceTags = (newsId: number, tagIds: number[]) => {
  const db = useDb();
  db.delete(schema.newsTags).where(eq(schema.newsTags.newsId, newsId)).run();
  if (tagIds.length) {
    db.insert(schema.newsTags)
      .values(tagIds.map((tagId) => ({ newsId, tagId })))
      .onConflictDoNothing()
      .run();
  }
};

const storedValues = (input: NewsInput, slug: string) => ({
  title: input.title,
  slug,
  categoryId: input.categoryId,
  excerptHtml: cleanEditorHtml(input.excerptHtml),
  bodyHtml: cleanEditorHtml(input.bodyHtml),
  status: input.status,
  commentsEnabled: input.commentsEnabled,
  publishedAt: input.status === 'published' ? (input.publishedAt ?? new Date()) : input.publishedAt,
  updatedAt: new Date(),
});

export const newsResource = defineAdminResource({
  access: 'news',
  inputSchema,
  translatable: {
    table: schema.news,
    fields: { title: 'text', excerptHtml: 'html', bodyHtml: 'html' },
  },
  list: ({ page, search, filter }) => {
    const db = useDb();
    const where = and(
      search ? like(schema.news.title, `%${search}%`) : undefined,
      filter === 'draft' || filter === 'published' ? eq(schema.news.status, filter) : undefined,
    );
    const items = db
      .select({
        id: schema.news.id,
        title: schema.news.title,
        slug: schema.news.slug,
        status: schema.news.status,
        publishedAt: schema.news.publishedAt,
        categoryName: schema.newsCategories.name,
        authorName: schema.users.name,
      })
      .from(schema.news)
      .innerJoin(schema.users, eq(schema.users.id, schema.news.authorId))
      .leftJoin(schema.newsCategories, eq(schema.newsCategories.id, schema.news.categoryId))
      .where(where)
      .orderBy(desc(schema.news.publishedAt), desc(schema.news.id))
      .limit(NEWS_PAGE_SIZE)
      .offset(pageOffset(page, NEWS_PAGE_SIZE))
      .all();
    const total = db.select({ total: count() }).from(schema.news).where(where).get()?.total ?? 0;
    return paginated(items, total, page, NEWS_PAGE_SIZE);
  },
  find: (id) => {
    const db = useDb();
    const news = db.select().from(schema.news).where(eq(schema.news.id, id)).get();
    if (!news) {
      return undefined;
    }
    const tagIds = db
      .select({ tagId: schema.newsTags.tagId })
      .from(schema.newsTags)
      .where(eq(schema.newsTags.newsId, id))
      .all()
      .map((row) => row.tagId);
    return { ...news, tagIds };
  },
  create: (input, actor) => {
    const slug = adminSlug(input.slug, input.title, (candidate) => isSlugTaken(candidate), 'news');
    const created = useDb()
      .insert(schema.news)
      .values({ ...storedValues(input, slug), authorId: actor.id })
      .returning({ id: schema.news.id })
      .get();
    replaceTags(created.id, input.tagIds);
    return created;
  },
  update: (id, input) => {
    const slug = adminSlug(input.slug, input.title, (candidate) => isSlugTaken(candidate, id), 'news');
    useDb().update(schema.news).set(storedValues(input, slug)).where(eq(schema.news.id, id)).run();
    replaceTags(id, input.tagIds);
  },
  remove: (id) => {
    const db = useDb();
    db.delete(schema.comments)
      .where(and(eq(schema.comments.targetKind, 'news'), eq(schema.comments.targetId, id)))
      .run();
    db.delete(schema.news).where(eq(schema.news.id, id)).run();
  },
});
