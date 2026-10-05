import { adminResourceNamed } from '../../../admin';

export default defineEventHandler(async (event) => {
  const resourceName = getRouterParam(event, 'resource');
  const resource = adminResourceNamed(resourceName);
  const actor = await requireAdminAccess(event, resource.access);
  const created = resource.create(await readBody(event), actor);
  recordAudit(actor, {
    action: 'create',
    entity: auditEntityOf(resourceName!),
    entityId: created.id,
    after: resource.find(created.id),
  });
  setResponseStatus(event, 201);
  return created;
});
