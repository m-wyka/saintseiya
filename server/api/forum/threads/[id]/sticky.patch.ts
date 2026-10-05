import { z } from 'zod';

const bodySchema = z.object({ isSticky: z.boolean() });

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'forum');
  const { isSticky } = await readValidatedBody(event, bodySchema.parse);
  return setThreadSticky(requiredIdParam(event), isSticky);
});
