const FEED_CACHE = 'public, max-age=900';

export default defineEventHandler((event) => {
  setResponseHeaders(event, { 'content-type': 'application/rss+xml; charset=utf-8', 'cache-control': FEED_CACHE });
  return newsFeedXml(contentLocaleOf(event), publicSiteUrl(), useRuntimeConfig().public.siteName);
});
