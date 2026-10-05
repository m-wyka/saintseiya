import { moderatedComments } from '../../../admin/community/comments';

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event, 'comments');
  return moderatedComments(await getValidatedQuery(event, adminListQuerySchema.parse));
});
