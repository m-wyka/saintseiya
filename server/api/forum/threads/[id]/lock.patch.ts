import { z } from 'zod';

const bodySchema = z.object({ isLocked: z.boolean() });

export default defineEventHandler(async (event) => {
  const actor = await requirePermission(event, 'forum');
  const { isLocked } = await readValidatedBody(event, bodySchema.parse);
  const id = requiredIdParam(event);
  return audited({ actor, table: schema.threads, id }, () => setThreadLocked(id, isLocked));
});
