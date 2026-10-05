export default defineEventHandler((event) =>
  foundOr404(findPublishedPage(getRouterParam(event, 'path') ?? '', contentLocaleOf(event)), 'ERRORS.PAGE_NOT_FOUND'),
);
