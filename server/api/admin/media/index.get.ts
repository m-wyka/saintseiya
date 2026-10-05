import { count, desc } from 'drizzle-orm';
import { THUMBNAILS_MEDIA_FOLDER } from '#shared/utils/routes';

const MEDIA_PAGE_SIZE = 36;

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event, 'staff');
  const page = await pageQuery(event);
  const db = useDb();
  const items = db
    .select()
    .from(schema.mediaImages)
    .orderBy(desc(schema.mediaImages.createdAt), desc(schema.mediaImages.id))
    .limit(MEDIA_PAGE_SIZE)
    .offset(pageOffset(page, MEDIA_PAGE_SIZE))
    .all()
    .map((media) => ({ ...media, thumbnail: thumbnailPathFor(media.image, THUMBNAILS_MEDIA_FOLDER) }));
  const total = db.select({ total: count() }).from(schema.mediaImages).get()?.total ?? 0;
  return paginated(items, total, page, MEDIA_PAGE_SIZE);
});
