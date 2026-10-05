import { downloadsResource } from '../../../admin/directory/downloads';

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event, downloadsResource.access);
  return foundOr404(downloadsResource.find(requiredIdParam(event)));
});
