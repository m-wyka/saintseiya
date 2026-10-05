import { adminResourceNamed } from '../../../admin';

export default defineEventHandler(async (event) => {
  const resourceName = getRouterParam(event, 'resource');
  const resource = adminResourceNamed(resourceName);
  const actor = await requireAdminAccess(event, resource.access);
  const id = requiredIdParam(event);
  const before = foundOr404(resource.find(id));
  resource.remove(id, actor);
  recordAudit(actor, { action: 'delete', entity: auditEntityOf(resourceName!), entityId: id, before });
  return { id };
});
