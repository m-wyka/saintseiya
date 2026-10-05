import { updatePhoto } from '../../../../admin/content/photos';

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event, 'gallery');
  return updatePhoto(requiredIdParam(event), await readBody(event));
});
