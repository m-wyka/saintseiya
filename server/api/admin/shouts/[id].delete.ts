import { removeShout } from '../../../admin/community/shouts';

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event, 'shoutbox');
  return removeShout(requiredIdParam(event));
});
