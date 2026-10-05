import { z } from 'zod';

const bodySchema = z.object({ forumId: z.number().int().positive() });

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'forum');
  const { forumId } = await readValidatedBody(event, bodySchema.parse);
  return moveThread(requiredIdParam(event), forumId);
});
