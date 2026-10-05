import { listUsers } from '../../../admin/community/users';

export default defineEventHandler(async (event) => {
  const viewer = await requireAdminAccess(event, 'users');
  return listUsers(await getValidatedQuery(event, adminListQuerySchema.parse), viewer);
});
