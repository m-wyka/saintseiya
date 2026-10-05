import { adminResourceNamed } from '../../../admin';

export default defineEventHandler(async (event) => {
  const resourceName = getRouterParam(event, 'resource');
  const resource = adminResourceNamed(resourceName);
  const actor = await requireAdminAccess(event, resource.access);
  const id = requiredIdParam(event);
  const locale = contentLocaleOf(event);
  const before = foundOr404(resource.find(id, locale));
  resource.update(id, await readBody(event), actor, locale);
  recordAudit(actor, {
    action: 'update',
    entity: auditEntityOf(resourceName!),
    entityId: id,
    before,
    after: resource.find(id, locale),
    locale,
  });
  return { id };
});
