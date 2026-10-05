import { removeComment } from '../../../admin/community/comments';

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event, 'comments');
  return removeComment(requiredIdParam(event));
});
