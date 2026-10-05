export default defineEventHandler((event) =>
  foundOr404(findPublishedPage(getRouterParam(event, 'path') ?? ''), 'ERRORS.PAGE_NOT_FOUND'),
);
