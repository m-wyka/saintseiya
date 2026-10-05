export default defineEventHandler((event) => {
  const photo = foundOr404(findPhoto(requiredIdParam(event), contentLocaleOf(event)), 'ERRORS.PHOTO_NOT_FOUND');
  countPhotoView(photo.id);
  return photo;
});
