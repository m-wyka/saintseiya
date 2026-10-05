import { adminResourceNamed } from '../../../admin';

export default defineEventHandler(async (event) => {
  const resource = adminResourceNamed(getRouterParam(event, 'resource'));
  const actor = await requireAdminAccess(event, resource.access);
  const id = requiredIdParam(event);
  foundOr404(resource.find(id));
  resource.remove(id, actor);
  return { id };
});
