export default defineEventHandler(async (event) =>
  foundOr404(albumPhotos(getRouterParam(event, 'slug') ?? '', await pageQuery(event)), 'Nie znaleziono albumu'),
);
