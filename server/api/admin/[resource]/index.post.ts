import { adminResourceNamed } from '../../../admin';

export default defineEventHandler(async (event) => {
  const resource = adminResourceNamed(getRouterParam(event, 'resource'));
  const actor = await requireAdminAccess(event, resource.access);
  const created = resource.create(await readBody(event), actor);
  setResponseStatus(event, 201);
  return created;
});
