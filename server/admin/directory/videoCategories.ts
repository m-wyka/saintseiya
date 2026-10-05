import { and, asc, count, eq, ne } from 'drizzle-orm';
import { z } from 'zod';
import { sortOrderSchema } from './inputs';

const SLUG_FALLBACK = 'kategoria';

const inputSchema = z.object({
  name: z.string().trim().min(2, 'Nazwa jest za krótka').max(100, 'Nazwa jest za długa'),
  slug: slugInputSchema,
  description: z.string().trim().max(500, 'Opis jest za długi').default(''),
  sortOrder: sortOrderSchema,
});

const isSlugTaken = (slug: string, exceptId?: number): boolean =>
  Boolean(
    useDb()
      .select({ id: schema.videoCategories.id })
      .from(schema.videoCategories)
      .where(and(eq(schema.videoCategories.slug, slug), exceptId ? ne(schema.videoCategories.id, exceptId) : undefined))
      .get(),
  );

const hasVideos = (categoryId: number): boolean =>
  Boolean(
    useDb().select({ id: schema.videos.id }).from(schema.videos).where(eq(schema.videos.categoryId, categoryId)).get(),
  );

export const videoCategoriesResource = defineAdminResource({
  access: 'videos',
  inputSchema,
  list: () =>
    useDb()
      .select({
        id: schema.videoCategories.id,
        name: schema.videoCategories.name,
        slug: schema.videoCategories.slug,
        description: schema.videoCategories.description,
        sortOrder: schema.videoCategories.sortOrder,
        videoCount: count(schema.videos.id),
      })
      .from(schema.videoCategories)
      .leftJoin(schema.videos, eq(schema.videos.categoryId, schema.videoCategories.id))
      .groupBy(schema.videoCategories.id)
      .orderBy(asc(schema.videoCategories.sortOrder), asc(schema.videoCategories.id))
      .all(),
  find: (id) => useDb().select().from(schema.videoCategories).where(eq(schema.videoCategories.id, id)).get(),
  create: (input) =>
    useDb()
      .insert(schema.videoCategories)
      .values({
        name: input.name,
        description: input.description,
        sortOrder: input.sortOrder,
        slug: adminSlug(input.slug, input.name, (candidate) => isSlugTaken(candidate), SLUG_FALLBACK),
      })
      .returning({ id: schema.videoCategories.id })
      .get(),
  update: (id, input) => {
    useDb()
      .update(schema.videoCategories)
      .set({
        name: input.name,
        description: input.description,
        sortOrder: input.sortOrder,
        slug: adminSlug(input.slug, input.name, (candidate) => isSlugTaken(candidate, id), SLUG_FALLBACK),
      })
      .where(eq(schema.videoCategories.id, id))
      .run();
  },
  remove: (id) => {
    if (hasVideos(id)) {
      throw conflict('W tej kategorii są filmy. Najpierw przenieś je lub usuń.');
    }
    useDb().delete(schema.videoCategories).where(eq(schema.videoCategories.id, id)).run();
  },
});
