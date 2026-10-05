const MEDIA_FOLDER = 'images';

export default defineEventHandler(async (event) => {
  const actor = await requireAdminAccess(event, 'staff');
  const uploads = await uploadedFilesOf(event);
  const stored = [];
  for (const upload of uploads) {
    const { image, width, height } = await storeUploadedImage(event, upload, MEDIA_FOLDER);
    stored.push(
      useDb().insert(schema.mediaImages).values({ image, width, height, uploadedById: actor.id }).returning().get(),
    );
  }
  setResponseStatus(event, 201);
  return stored;
});
