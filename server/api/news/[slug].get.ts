export default defineEventHandler((event) => {
  const news = foundOr404(
    findPublishedNews(getRouterParam(event, 'slug') ?? '', contentLocaleOf(event)),
    'ERRORS.NEWS_NOT_FOUND',
  );
  countNewsView(news.id);
  return news;
});
