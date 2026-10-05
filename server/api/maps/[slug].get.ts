export default defineEventHandler((event) =>
  foundOr404(findPublishedMap(getRouterParam(event, 'slug') ?? ''), 'ERRORS.MAP_NOT_FOUND'),
);
