import { asc } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event, 'staff');
  return useDb()
    .select({ id: schema.tags.id, name: schema.tags.name })
    .from(schema.tags)
    .orderBy(asc(schema.tags.name))
    .all();
});
