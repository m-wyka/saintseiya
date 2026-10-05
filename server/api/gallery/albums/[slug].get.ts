export default defineEventHandler(async (event) =>
  foundOr404(
    albumPhotos(getRouterParam(event, 'slug') ?? '', await pageQuery(event), contentLocaleOf(event)),
    'ERRORS.ALBUM_NOT_FOUND',
  ),
);
