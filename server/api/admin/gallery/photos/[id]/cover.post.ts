import { eq } from 'drizzle-orm';
import { setAlbumCover } from '../../../../../admin/content/photos';

export default defineEventHandler(async (event) => {
  const actor = await requireAdminAccess(event, 'gallery');
  const id = requiredIdParam(event);
  const locale = contentLocaleOf(event);
  const photo = foundOr404(
    useDb().select({ albumId: schema.photos.albumId }).from(schema.photos).where(eq(schema.photos.id, id)).get(),
    'ERRORS.PHOTO_NOT_FOUND',
  );
  await audited({ actor, table: schema.albums, id: photo.albumId, locale }, () => setAlbumCover(id, locale));
  return { id };
});
