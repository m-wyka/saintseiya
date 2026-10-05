import { z } from 'zod';
import { listPageLevel } from '../../../admin/content/pages';

const querySchema = z.object({ parent: z.coerce.number().int().positive().optional() });

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event, 'pages');
  const { parent } = await getValidatedQuery(event, querySchema.parse);
  return listPageLevel(parent ?? null);
});
