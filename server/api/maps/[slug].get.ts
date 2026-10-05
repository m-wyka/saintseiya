export default defineEventHandler((event) =>
  foundOr404(findPublishedMap(getRouterParam(event, 'slug') ?? '', contentLocaleOf(event)), 'ERRORS.MAP_NOT_FOUND'),
);
