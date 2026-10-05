import { z } from 'zod';

const querySchema = adminListQuerySchema.extend({ entity: z.string().trim().max(60).default('') });

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event, 'admin');
  return listAuditLog(await getValidatedQuery(event, querySchema.parse));
});
