import { downloadsResource, findDownload } from '../../../admin/directory/downloads';

export default defineEventHandler(async (event) => {
  const actor = await requireAdminAccess(event, downloadsResource.access);
  const id = requiredIdParam(event);
  const download = foundOr404(findDownload(id));
  downloadsResource.remove(id, actor);
  await removeStoredFiles(event, [download.file]);
  return { id };
});
