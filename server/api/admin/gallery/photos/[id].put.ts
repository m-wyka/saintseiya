import { updatePhoto } from '../../../../admin/content/photos';

export default defineEventHandler(async (event) => {
  const actor = await requireAdminAccess(event, 'gallery');
  const id = requiredIdParam(event);
  const locale = contentLocaleOf(event);
  return audited({ actor, table: schema.photos, id, locale }, async () =>
    updatePhoto(id, await readBody(event), locale),
  );
});
