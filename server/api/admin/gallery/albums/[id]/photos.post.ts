import { uploadPhotos } from '../../../../../admin/content/photos';

export default defineEventHandler(async (event) => {
  const uploader = await requireAdminAccess(event, 'gallery');
  const added = await uploadPhotos(event, requiredIdParam(event), await uploadedFilesOf(event), uploader);
  setResponseStatus(event, 201);
  return added;
});
