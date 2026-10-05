import { uploadPhotos } from '../../../../../admin/content/photos';

export default defineEventHandler(async (event) => {
  const uploader = await requireAdminAccess(event, 'gallery');
  const added = await uploadPhotos(event, requiredIdParam(event), await uploadedFilesOf(event), uploader);
  for (const photo of added) {
    recordAudit(uploader, { action: 'create', entity: 'photos', entityId: photo.id, after: photo });
  }
  setResponseStatus(event, 201);
  return added;
});
