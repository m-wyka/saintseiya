import { moderatedShouts } from '../../../admin/community/shouts';

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event, 'shoutbox');
  return moderatedShouts(await getValidatedQuery(event, adminListQuerySchema.parse));
});
