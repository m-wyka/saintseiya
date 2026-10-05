import { asc, like } from 'drizzle-orm';
import { z } from 'zod';

const LOOKUP_LIMIT = 12;
const querySchema = z.object({ search: z.string().trim().max(120).default('') });

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event, 'staff');
  const { search } = await getValidatedQuery(event, querySchema.parse);
  return useDb()
    .select({ id: schema.pages.id, title: schema.pages.title, path: schema.pages.path })
    .from(schema.pages)
    .where(search ? like(schema.pages.title, `%${search}%`) : undefined)
    .orderBy(asc(schema.pages.path))
    .limit(LOOKUP_LIMIT)
    .all();
});
