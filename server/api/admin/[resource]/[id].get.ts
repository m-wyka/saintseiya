import { adminResourceNamed } from '../../../admin';

export default defineEventHandler(async (event) => {
  const resource = adminResourceNamed(getRouterParam(event, 'resource'));
  await requireAdminAccess(event, resource.access);
  return foundOr404(resource.find(requiredIdParam(event)));
});
