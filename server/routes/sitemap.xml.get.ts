const SITEMAP_CACHE = 'public, max-age=3600';

export default defineEventHandler((event) => {
  setResponseHeaders(event, { 'content-type': 'application/xml; charset=utf-8', 'cache-control': SITEMAP_CACHE });
  return sitemapXml(listSitemapEntries(), publicSiteUrl());
});
