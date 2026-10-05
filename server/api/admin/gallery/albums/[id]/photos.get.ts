import { listAlbumPhotos } from '../../../../../admin/content/photos';

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event, 'gallery');
  return listAlbumPhotos(requiredIdParam(event));
});
