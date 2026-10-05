export default defineEventHandler((event) =>
  foundOr404(findPublishedPage(getRouterParam(event, 'path') ?? ''), 'Nie znaleziono strony'),
);
