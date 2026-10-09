import { and, eq } from 'drizzle-orm';
import type { ContentLocale } from '#shared/utils/locales';
import { CONTENT_LOCALES, DEFAULT_LOCALE, withLocalePrefix } from '#shared/utils/locales';
import { englishPagePath, routes } from '#shared/utils/routes';
import englishMessages from '../../i18n/locales/en.json';
import polishMessages from '../../i18n/locales/pl.json';
import { schema, useDb } from './db';

const FEED_NEWS_COUNT = 20;
const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>';
const MESSAGES: Record<ContentLocale, Record<string, string>> = { pl: polishMessages, en: englishMessages };

interface SitemapEntry {
  polishPath: string;
  englishPath: string;
  updatedAt?: Date | null;
}

const sectionEntry = (polishPath: string): SitemapEntry => ({ polishPath, englishPath: englishPagePath(polishPath) });

// Only the part before the slug is a page file name; a slug that happens to match one must stay as it is.
const recordEntry = (polishPath: string, updatedAt?: Date | null): SitemapEntry => {
  const slugStart = polishPath.lastIndexOf('/');
  return {
    polishPath,
    englishPath: `${englishPagePath(polishPath.slice(0, slugStart))}${polishPath.slice(slugStart)}`,
    updatedAt,
  };
};

const contentPageEntry = (path: string, updatedAt: Date | null): SitemapEntry => ({
  polishPath: routes.page(path),
  englishPath: routes.page(path),
  updatedAt,
});

const SECTION_ENTRIES = [
  routes.home(),
  routes.newsList(),
  routes.forumIndex(),
  routes.gallery(),
  routes.videos(),
  routes.maps(),
  routes.links(),
  routes.faq(),
  routes.downloads(),
  routes.polls(),
  routes.shoutbox(),
].map(sectionEntry);

export const listSitemapEntries = (): SitemapEntry[] => {
  const db = useDb();
  const news = db
    .select({ slug: schema.news.slug, updatedAt: schema.news.updatedAt })
    .from(schema.news)
    .where(eq(schema.news.status, 'published'))
    .all();
  const newsCategories = db.select({ slug: schema.newsCategories.slug }).from(schema.newsCategories).all();
  const tags = db.select({ slug: schema.tags.slug }).from(schema.tags).all();
  const pages = db
    .select({ path: schema.pages.path, updatedAt: schema.pages.updatedAt })
    .from(schema.pages)
    .where(eq(schema.pages.status, 'published'))
    .all();
  const forums = db
    .select({ slug: schema.forums.slug })
    .from(schema.forums)
    .where(eq(schema.forums.isStaffOnly, false))
    .all();
  const threads = db
    .select({ id: schema.threads.id, lastPostAt: schema.threads.lastPostAt })
    .from(schema.threads)
    .innerJoin(schema.forums, and(eq(schema.forums.id, schema.threads.forumId), eq(schema.forums.isStaffOnly, false)))
    .all();
  const albums = db.select({ slug: schema.albums.slug }).from(schema.albums).all();
  const photos = db.select({ id: schema.photos.id }).from(schema.photos).all();
  const videoCategories = db.select({ slug: schema.videoCategories.slug }).from(schema.videoCategories).all();
  const maps = db
    .select({ slug: schema.maps.slug, updatedAt: schema.maps.updatedAt })
    .from(schema.maps)
    .where(eq(schema.maps.status, 'published'))
    .all();

  return [
    ...SECTION_ENTRIES,
    ...news.map(({ slug, updatedAt }) => recordEntry(routes.news(slug), updatedAt)),
    ...newsCategories.map(({ slug }) => recordEntry(routes.newsCategory(slug))),
    ...tags.map(({ slug }) => recordEntry(routes.tag(slug))),
    ...pages.map(({ path, updatedAt }) => contentPageEntry(path, updatedAt)),
    ...forums.map(({ slug }) => recordEntry(routes.forum(slug))),
    ...threads.map(({ id, lastPostAt }) => recordEntry(routes.thread(id), lastPostAt)),
    ...albums.map(({ slug }) => recordEntry(routes.album(slug))),
    ...photos.map(({ id }) => recordEntry(routes.photo(id))),
    ...videoCategories.map(({ slug }) => recordEntry(routes.videoCategory(slug))),
    ...maps.map(({ slug, updatedAt }) => recordEntry(routes.map(slug), updatedAt)),
  ];
};

const localizedPathOf = (entry: SitemapEntry, locale: ContentLocale): string =>
  locale === DEFAULT_LOCALE ? entry.polishPath : withLocalePrefix(entry.englishPath, locale).replace(/\/$/, '');

const sitemapUrlTag = (entry: SitemapEntry, locale: ContentLocale, siteUrl: string): string => {
  const alternates = CONTENT_LOCALES.map(
    (alternate) =>
      `<xhtml:link rel="alternate" hreflang="${alternate}" href="${escapeHtml(siteUrl + localizedPathOf(entry, alternate))}"/>`,
  ).join('');
  const lastModified = entry.updatedAt ? `<lastmod>${entry.updatedAt.toISOString()}</lastmod>` : '';
  return `<url><loc>${escapeHtml(siteUrl + localizedPathOf(entry, locale))}</loc>${lastModified}${alternates}</url>`;
};

export const sitemapXml = (entries: SitemapEntry[], siteUrl: string): string => {
  const urlTags = entries.flatMap((entry) => CONTENT_LOCALES.map((locale) => sitemapUrlTag(entry, locale, siteUrl)));
  return [
    XML_DECLARATION,
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urlTags,
    '</urlset>',
  ].join('\n');
};

const feedItemTag = (
  news: { slug: string; title: string; teaser: string; publishedAt: Date | null; category: { name: string } | null },
  locale: ContentLocale,
  siteUrl: string,
): string => {
  const link = escapeHtml(siteUrl + localizedPathOf(recordEntry(routes.news(news.slug)), locale));
  return [
    '<item>',
    `<title>${escapeHtml(news.title)}</title>`,
    `<link>${link}</link>`,
    `<guid isPermaLink="true">${link}</guid>`,
    news.publishedAt ? `<pubDate>${news.publishedAt.toUTCString()}</pubDate>` : '',
    news.category ? `<category>${escapeHtml(news.category.name)}</category>` : '',
    `<description>${escapeHtml(news.teaser)}</description>`,
    '</item>',
  ].join('');
};

export const newsFeedXml = (locale: ContentLocale, siteUrl: string, siteName: string): string => {
  const messages = MESSAGES[locale];
  const news = listPublishedNews({ page: 1 }, FEED_NEWS_COUNT, locale).items;
  const feedUrl = escapeHtml(siteUrl + withLocalePrefix(routes.newsFeed(), locale));
  return [
    XML_DECLARATION,
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '<channel>',
    `<title>${escapeHtml(`${siteName} — ${messages['GENERAL.NEWS']}`)}</title>`,
    `<link>${escapeHtml(siteUrl + localizedPathOf(sectionEntry(routes.newsList()), locale))}</link>`,
    `<description>${escapeHtml(messages['LAYOUT.SITE_DESCRIPTION'] ?? siteName)}</description>`,
    `<language>${locale}</language>`,
    `<atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>`,
    ...news.map((item) => feedItemTag(item, locale, siteUrl)),
    '</channel>',
    '</rss>',
  ].join('\n');
};

export const robotsText = (siteUrl: string): string =>
  [
    'User-agent: *',
    'Disallow: /admin',
    'Disallow: /en/admin',
    'Disallow: /api/',
    'Disallow: /auth/',
    `Sitemap: ${siteUrl}${routes.sitemap()}`,
    '',
  ].join('\n');

export const publicSiteUrl = (): string => useRuntimeConfig().public.siteUrl.replace(/\/+$/, '');
