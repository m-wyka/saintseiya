import { removePhoto } from '../../../../admin/content/photos';

export default defineEventHandler(async (event) => {
  const actor = await requireAdminAccess(event, 'gallery');
  const id = requiredIdParam(event);
  await audited({ actor, table: schema.photos, id }, () => removePhoto(event, id));
  return { id };
});
