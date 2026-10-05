import { z } from 'zod';
import { COMMENT_TARGETS } from '#shared/utils/content';

const querySchema = z.object({
  targetKind: z.enum(COMMENT_TARGETS),
  targetId: z.coerce.number().int().positive(),
  page: pageNumberSchema,
});

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, querySchema.parse);
  return listComments(query.targetKind, query.targetId, query.page);
});
