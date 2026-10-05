import { z } from 'zod';

const bodySchema = z.object({ forumId: z.number().int().positive() });

export default defineEventHandler(async (event) => {
  const actor = await requirePermission(event, 'forum');
  const { forumId } = await readValidatedBody(event, bodySchema.parse);
  const id = requiredIdParam(event);
  return audited({ actor, table: schema.threads, id }, () => moveThread(id, forumId));
});
