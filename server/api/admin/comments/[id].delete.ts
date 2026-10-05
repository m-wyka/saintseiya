import { removeComment } from '../../../admin/community/comments';

export default defineEventHandler(async (event) => {
  const actor = await requireAdminAccess(event, 'comments');
  const id = requiredIdParam(event);
  return audited({ actor, table: schema.comments, id }, () => removeComment(id));
});
