import { z } from 'zod';

const bodySchema = z.object({ isLocked: z.boolean() });

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'forum');
  const { isLocked } = await readValidatedBody(event, bodySchema.parse);
  return setThreadLocked(requiredIdParam(event), isLocked);
});
