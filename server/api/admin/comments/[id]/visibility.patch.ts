import { setCommentHidden } from '../../../../admin/community/comments';
import { visibilityInputSchema } from '../../../../admin/community/visibility';

export default defineEventHandler(async (event) => {
  const actor = await requireAdminAccess(event, 'comments');
  const { isHidden } = parseInput(visibilityInputSchema, await readBody(event));
  const id = requiredIdParam(event);
  return audited({ actor, table: schema.comments, id }, () => setCommentHidden(id, isHidden));
});
