import { downloadsResource } from '../../../admin/directory/downloads';

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event, downloadsResource.access);
  return downloadsResource.list(await getValidatedQuery(event, adminListQuerySchema.parse));
});
