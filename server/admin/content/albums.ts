import { and, asc, count, eq, ne } from 'drizzle-orm';
import { z } from 'zod';

const PHOTO_ROUTE_SEGMENT = 'zdjecie';
const SLUG_FALLBACK = 'album';

const inputSchema = z.object({
  title: z.string().trim().min(2, 'VALIDATION.TITLE_TOO_SHORT').max(120),
  slug: slugInputSchema,
  description: z.string().trim().max(1000).default(''),
  sortOrder: z.number().int().min(0).max(9999).default(0),
});

const isSlugTaken = (slug: string, exceptId?: number): boolean =>
  slug === PHOTO_ROUTE_SEGMENT ||
  Boolean(
    useDb()
      .select({ id: schema.albums.id })
      .from(schema.albums)
      .where(and(eq(schema.albums.slug, slug), exceptId ? ne(schema.albums.id, exceptId) : undefined))
      .get(),
  );

const hasPhotos = (albumId: number): boolean =>
  Boolean(useDb().select({ id: schema.photos.id }).from(schema.photos).where(eq(schema.photos.albumId, albumId)).get());

export const albumsResource = defineAdminResource({
  access: 'gallery',
  inputSchema,
  list: () =>
    useDb()
      .select({
        id: schema.albums.id,
        slug: schema.albums.slug,
        title: schema.albums.title,
        coverImage: schema.albums.coverImage,
        sortOrder: schema.albums.sortOrder,
        photoCount: count(schema.photos.id),
      })
      .from(schema.albums)
      .leftJoin(schema.photos, eq(schema.photos.albumId, schema.albums.id))
      .groupBy(schema.albums.id)
      .orderBy(asc(schema.albums.sortOrder), asc(schema.albums.id))
      .all(),
  find: (id) => useDb().select().from(schema.albums).where(eq(schema.albums.id, id)).get(),
  create: (input) =>
    useDb()
      .insert(schema.albums)
      .values({
        title: input.title,
        description: input.description,
        sortOrder: input.sortOrder,
        slug: adminSlug(input.slug, input.title, (candidate) => isSlugTaken(candidate), SLUG_FALLBACK),
      })
      .returning({ id: schema.albums.id })
      .get(),
  update: (id, input) => {
    useDb()
      .update(schema.albums)
      .set({
        title: input.title,
        description: input.description,
        sortOrder: input.sortOrder,
        slug: adminSlug(input.slug, input.title, (candidate) => isSlugTaken(candidate, id), SLUG_FALLBACK),
      })
      .where(eq(schema.albums.id, id))
      .run();
  },
  remove: (id) => {
    if (hasPhotos(id)) {
      throw conflict('ERRORS.ALBUM_HAS_PHOTOS');
    }
    useDb().delete(schema.albums).where(eq(schema.albums.id, id)).run();
  },
});
