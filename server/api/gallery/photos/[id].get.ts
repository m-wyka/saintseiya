export default defineEventHandler((event) => {
  const photo = foundOr404(findPhoto(requiredIdParam(event)), 'Nie znaleziono zdjęcia');
  countPhotoView(photo.id);
  return photo;
});
