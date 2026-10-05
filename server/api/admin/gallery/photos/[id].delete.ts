import { removePhoto } from '../../../../admin/content/photos';

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event, 'gallery');
  const id = requiredIdParam(event);
  await removePhoto(event, id);
  return { id };
});
