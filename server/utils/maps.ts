import { and, asc, eq, getTableColumns, inArray } from 'drizzle-orm';
import type { ContentLocale } from '#shared/utils/locales';
import { DEFAULT_LOCALE } from '#shared/utils/locales';
import { routes } from '#shared/utils/routes';
import { schema, useDb } from './db';
import { localized } from './translations';

const publishedMaps = eq(schema.maps.status, 'published');

const localizedMapColumns = (locale: ContentLocale) => ({
  title: localized(schema.maps.title, locale),
  description: localized(schema.maps.description, locale),
  image: localized(schema.maps.image, locale),
  teaserImage: localized(schema.maps.teaserImage, locale),
});

export const listPublishedMaps = (locale: ContentLocale = DEFAULT_LOCALE) =>
  useDb()
    .select({ slug: schema.maps.slug, ...localizedMapColumns(locale) })
    .from(schema.maps)
    .where(publishedMaps)
    .orderBy(asc(schema.maps.sortOrder), asc(schema.maps.id))
    .all();

const publishedPageAddresses = (pageIds: number[]): Map<number, string> => {
  if (!pageIds.length) {
    return new Map();
  }
  const pages = useDb()
    .select({ id: schema.pages.id, path: schema.pages.path })
    .from(schema.pages)
    .where(and(inArray(schema.pages.id, pageIds), eq(schema.pages.status, 'published')))
    .all();
  return new Map(pages.map((page) => [page.id, routes.page(page.path)]));
};

export const findPublishedMap = (slug: string, locale: ContentLocale = DEFAULT_LOCALE) => {
  const db = useDb();
  const map = db
    .select({ ...getTableColumns(schema.maps), ...localizedMapColumns(locale) })
    .from(schema.maps)
    .where(and(eq(schema.maps.slug, slug), publishedMaps))
    .get();
  if (!map) {
    return null;
  }
  const areas = db
    .select({
      ...getTableColumns(schema.mapAreas),
      label: localized(schema.mapAreas.label, locale),
      contentHtml: localized(schema.mapAreas.contentHtml, locale),
    })
    .from(schema.mapAreas)
    .where(eq(schema.mapAreas.mapId, map.id))
    .orderBy(asc(schema.mapAreas.sortOrder), asc(schema.mapAreas.id))
    .all();
  const pageAddresses = publishedPageAddresses(areas.flatMap((area) => (area.pageId === null ? [] : [area.pageId])));
  const linkOf = (area: (typeof areas)[number]): string | null =>
    area.targetKind === 'page'
      ? (pageAddresses.get(area.pageId ?? 0) ?? null)
      : area.targetKind === 'url'
        ? area.url
        : null;

  return {
    slug: map.slug,
    title: map.title,
    description: map.description,
    image: map.image,
    imageWidth: map.imageWidth,
    imageHeight: map.imageHeight,
    areas: areas
      .map((area) => ({
        id: area.id,
        label: area.label,
        leftPercent: area.leftPercent,
        topPercent: area.topPercent,
        widthPercent: area.widthPercent,
        heightPercent: area.heightPercent,
        targetKind: area.targetKind,
        link: linkOf(area),
        contentHtml: area.targetKind === 'content' && area.contentHtml ? markMissingImages(area.contentHtml) : null,
      }))
      .filter((area) => area.link !== null || area.contentHtml !== null),
  };
};
