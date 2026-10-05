import { eq } from 'drizzle-orm';
import { THUMBNAILS_MEDIA_FOLDER } from '#shared/utils/routes';

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event, 'staff');
  const id = requiredIdParam(event);
  const db = useDb();
  const media = foundOr404(db.select().from(schema.mediaImages).where(eq(schema.mediaImages.id, id)).get());
  db.delete(schema.mediaImages).where(eq(schema.mediaImages.id, id)).run();
  await removeStoredFiles(event, [media.image, thumbnailPathFor(media.image, THUMBNAILS_MEDIA_FOLDER)]);
  return { id };
});
