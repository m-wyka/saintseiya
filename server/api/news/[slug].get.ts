export default defineEventHandler((event) => {
  const news = foundOr404(findPublishedNews(getRouterParam(event, 'slug') ?? ''), 'Nie znaleziono newsa');
  countNewsView(news.id);
  return news;
});
