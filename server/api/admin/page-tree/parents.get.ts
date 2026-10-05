import { z } from 'zod';
import { findParentCandidates } from '../../../admin/content/pages';

const querySchema = z.object({
  search: z.string().trim().min(1).max(120),
  pageId: z.coerce.number().int().positive().optional(),
});

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event, 'pages');
  const { search, pageId } = await getValidatedQuery(event, querySchema.parse);
  return findParentCandidates(search, pageId ?? null);
});
