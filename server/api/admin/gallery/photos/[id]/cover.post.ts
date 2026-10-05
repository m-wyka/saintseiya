import { setAlbumCover } from '../../../../../admin/content/photos';

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event, 'gallery');
  const id = requiredIdParam(event);
  setAlbumCover(id);
  return { id };
});
