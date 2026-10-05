import { setCommentHidden } from '../../../../admin/community/comments';
import { visibilityInputSchema } from '../../../../admin/community/visibility';

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event, 'comments');
  const { isHidden } = parseInput(visibilityInputSchema, await readBody(event));
  return setCommentHidden(requiredIdParam(event), isHidden);
});
