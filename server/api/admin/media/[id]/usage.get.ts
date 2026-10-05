import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event, 'staff');
  const media = foundOr404(
    useDb()
      .select()
      .from(schema.mediaImages)
      .where(eq(schema.mediaImages.id, requiredIdParam(event)))
      .get(),
  );
  return { isUsed: isMediaImageUsed(media.image) };
});
