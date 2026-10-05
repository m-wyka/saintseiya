export default defineEventHandler(async (event) => {
  await requireAdminAccess(event, 'maps');
  const [upload] = await uploadedFilesOf(event);
  setResponseStatus(event, 201);
  return storeUploadedImage(event, upload!, MAP_IMAGES_FOLDER);
});
