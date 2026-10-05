import { and, asc, eq, ne, sql } from 'drizzle-orm';
import { z } from 'zod';

const inputSchema = z.object({
  name: z.string().trim().min(2, 'Nazwa jest za krótka').max(60),
  slug: slugInputSchema,
});

const isSlugTaken = (slug: string, exceptId?: number): boolean =>
  Boolean(
    useDb()
      .select({ id: schema.tags.id })
      .from(schema.tags)
      .where(and(eq(schema.tags.slug, slug), exceptId ? ne(schema.tags.id, exceptId) : undefined))
      .get(),
  );

const usageCount = sql<number>`(
  (SELECT COUNT(*) FROM ${schema.newsTags} WHERE ${qualified(schema.newsTags.tagId)} = ${qualified(schema.tags.id)}) +
  (SELECT COUNT(*) FROM ${schema.pageTags} WHERE ${qualified(schema.pageTags.tagId)} = ${qualified(schema.tags.id)})
)`;

export const tagsResource = defineAdminResource({
  access: 'news',
  inputSchema,
  list: () =>
    useDb()
      .select({ id: schema.tags.id, name: schema.tags.name, slug: schema.tags.slug, usageCount })
      .from(schema.tags)
      .orderBy(asc(schema.tags.name))
      .all(),
  find: (id) => useDb().select().from(schema.tags).where(eq(schema.tags.id, id)).get(),
  create: (input) =>
    useDb()
      .insert(schema.tags)
      .values({
        name: input.name,
        slug: adminSlug(input.slug, input.name, (candidate) => isSlugTaken(candidate), 'tag'),
      })
      .returning({ id: schema.tags.id })
      .get(),
  update: (id, input) => {
    useDb()
      .update(schema.tags)
      .set({
        name: input.name,
        slug: adminSlug(input.slug, input.name, (candidate) => isSlugTaken(candidate, id), 'tag'),
      })
      .where(eq(schema.tags.id, id))
      .run();
  },
  remove: (id) => {
    useDb().delete(schema.tags).where(eq(schema.tags.id, id)).run();
  },
});
