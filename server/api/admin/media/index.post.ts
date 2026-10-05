const MEDIA_FOLDER = 'images';

export default defineEventHandler(async (event) => {
  const actor = await requireAdminAccess(event, 'staff');
  const uploads = await uploadedFilesOf(event);
  const stored = [];
  for (const upload of uploads) {
    const { image, width, height } = await storeUploadedImage(event, upload, MEDIA_FOLDER);
    const media = useDb()
      .insert(schema.mediaImages)
      .values({ image, width, height, uploadedById: actor.id })
      .returning()
      .get();
    recordAudit(actor, { action: 'create', entity: 'media_images', entityId: media.id, after: media });
    stored.push(media);
  }
  setResponseStatus(event, 201);
  return stored;
});
