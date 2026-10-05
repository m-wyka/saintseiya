import { and, count, desc, eq, like } from 'drizzle-orm';
import { z } from 'zod';
import { existingIdSchema } from './inputs';

const VIDEOS_PAGE_SIZE = 20;
const BARE_YOUTUBE_ID_PATTERN = /^[\w-]{11}$/;
const NOT_A_YOUTUBE_VIDEO = 'VALIDATION.YOUTUBE_VIDEO_REQUIRED';

const youtubeIdOf = (addressOrId: string): string | null =>
  BARE_YOUTUBE_ID_PATTERN.test(addressOrId) ? addressOrId : youtubeIdFromUrl(addressOrId);

const categoryExists = (categoryId: number): boolean =>
  Boolean(
    useDb()
      .select({ id: schema.videoCategories.id })
      .from(schema.videoCategories)
      .where(eq(schema.videoCategories.id, categoryId))
      .get(),
  );

const inputSchema = z.object({
  title: z.string().trim().min(2, 'VALIDATION.TITLE_TOO_SHORT').max(200, 'VALIDATION.TITLE_TOO_LONG'),
  description: z.string().trim().max(1000, 'VALIDATION.DESCRIPTION_TOO_LONG').default(''),
  categoryId: existingIdSchema(categoryExists, 'VALIDATION.CATEGORY_REQUIRED'),
  youtubeId: z.string().trim().max(300, NOT_A_YOUTUBE_VIDEO).transform(youtubeIdOf).pipe(z.string(NOT_A_YOUTUBE_VIDEO)),
});

type VideoInput = z.infer<typeof inputSchema>;

const storedValues = (input: VideoInput) => ({
  title: input.title,
  description: input.description,
  categoryId: input.categoryId,
  youtubeId: input.youtubeId,
});

export const videosResource = defineAdminResource({
  access: 'videos',
  inputSchema,
  translatable: {
    table: schema.videos,
    fields: { title: 'text', description: 'text' },
  },
  list: ({ page, search }) => {
    const db = useDb();
    const where = search ? like(schema.videos.title, `%${search}%`) : undefined;
    const items = db
      .select({
        id: schema.videos.id,
        title: schema.videos.title,
        youtubeId: schema.videos.youtubeId,
        createdAt: schema.videos.createdAt,
        categoryName: schema.videoCategories.name,
      })
      .from(schema.videos)
      .innerJoin(schema.videoCategories, eq(schema.videoCategories.id, schema.videos.categoryId))
      .where(where)
      .orderBy(desc(schema.videos.createdAt), desc(schema.videos.id))
      .limit(VIDEOS_PAGE_SIZE)
      .offset(pageOffset(page, VIDEOS_PAGE_SIZE))
      .all();
    const total = db.select({ total: count() }).from(schema.videos).where(where).get()?.total ?? 0;
    return paginated(items, total, page, VIDEOS_PAGE_SIZE);
  },
  find: (id) => useDb().select().from(schema.videos).where(eq(schema.videos.id, id)).get(),
  create: (input, actor) =>
    useDb()
      .insert(schema.videos)
      .values({ ...storedValues(input), authorId: actor.id })
      .returning({ id: schema.videos.id })
      .get(),
  update: (id, input) => {
    useDb().update(schema.videos).set(storedValues(input)).where(eq(schema.videos.id, id)).run();
  },
  remove: (id) => {
    const db = useDb();
    db.delete(schema.comments)
      .where(and(eq(schema.comments.targetKind, 'video'), eq(schema.comments.targetId, id)))
      .run();
    db.delete(schema.videos).where(eq(schema.videos.id, id)).run();
  },
});
