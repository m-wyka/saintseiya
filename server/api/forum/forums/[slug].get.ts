export default defineEventHandler(async (event) => {
  const page = await pageQuery(event);
  return foundOr404(
    forumThreads(getRouterParam(event, 'slug') ?? '', page, await viewerOf(event)),
    'Nie znaleziono działu',
  );
});
