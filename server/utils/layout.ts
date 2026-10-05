import { asc, count, eq, getTableColumns } from 'drizzle-orm';
import type { ContentLocale } from '#shared/utils/locales';
import { DEFAULT_LOCALE } from '#shared/utils/locales';
import { schema, useDb } from './db';
import { localized } from './translations';

const navigationSections = (locale: ContentLocale) => {
  const db = useDb();
  const sections = db
    .select({ id: schema.navigationSections.id, title: localized(schema.navigationSections.title, locale) })
    .from(schema.navigationSections)
    .orderBy(asc(schema.navigationSections.sortOrder))
    .all();
  const links = db
    .select({
      ...getTableColumns(schema.navigationLinks),
      groupTitle: localized(schema.navigationLinks.groupTitle, locale),
      label: localized(schema.navigationLinks.label, locale),
    })
    .from(schema.navigationLinks)
    .orderBy(asc(schema.navigationLinks.sectionId), asc(schema.navigationLinks.sortOrder))
    .all();
  const linksBySection = Map.groupBy(links, (link) => link.sectionId);
  return sections.map((section) => ({
    id: section.id,
    title: section.title,
    links: (linksBySection.get(section.id) ?? []).map(({ id, groupTitle, label, url }) => ({
      id,
      groupTitle,
      label,
      url,
    })),
  }));
};

const totalOf = (table: typeof schema.posts | typeof schema.threads | typeof schema.news | typeof schema.comments) =>
  useDb().select({ total: count() }).from(table).get()?.total ?? 0;

const siteStatistics = () => ({
  memberCount:
    useDb().select({ total: count() }).from(schema.users).where(eq(schema.users.isGhost, false)).get()?.total ?? 0,
  newsCount: totalOf(schema.news),
  threadCount: totalOf(schema.threads),
  postCount: totalOf(schema.posts),
  commentCount: totalOf(schema.comments),
});

export const siteLayout = (locale: ContentLocale = DEFAULT_LOCALE) => ({
  navigation: navigationSections(locale),
  statistics: siteStatistics(),
  maps: listPublishedMaps(locale),
});
