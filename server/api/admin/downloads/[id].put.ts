import { downloadsResource } from '../../../admin/directory/downloads';

export default defineEventHandler(async (event) => {
  const actor = await requireAdminAccess(event, downloadsResource.access);
  const id = requiredIdParam(event);
  foundOr404(downloadsResource.find(id));
  downloadsResource.update(id, await readBody(event), actor, contentLocaleOf(event));
  return { id };
});
