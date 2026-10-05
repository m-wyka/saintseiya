import { z } from 'zod';

const bodySchema = z.object({ isSticky: z.boolean() });

export default defineEventHandler(async (event) => {
  const actor = await requirePermission(event, 'forum');
  const { isSticky } = await readValidatedBody(event, bodySchema.parse);
  const id = requiredIdParam(event);
  return audited({ actor, table: schema.threads, id }, () => setThreadSticky(id, isSticky));
});
