export default defineEventHandler((event) =>
  foundOr404(findPublishedMap(getRouterParam(event, 'slug') ?? ''), 'Nie znaleziono mapy'),
);
