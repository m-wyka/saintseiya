import { asc, count, eq, getTableColumns, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
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

const totalOf = (table: typeof schema.users | typeof schema.news | typeof schema.comments, filter: SQL) =>
  useDb().select({ total: count() }).from(table).where(filter).get()?.total ?? 0;

const publicForumTotals = () =>
  useDb()
    .select({
      threadCount: sql<number>`coalesce(sum(${schema.forums.threadCount}), 0)`,
      postCount: sql<number>`coalesce(sum(${schema.forums.postCount}), 0)`,
    })
    .from(schema.forums)
    .where(eq(schema.forums.isStaffOnly, false))
    .get();

const siteStatistics = () => ({
  memberCount: totalOf(schema.users, eq(schema.users.isGhost, false)),
  newsCount: totalOf(schema.news, eq(schema.news.status, 'published')),
  threadCount: publicForumTotals()?.threadCount ?? 0,
  postCount: publicForumTotals()?.postCount ?? 0,
  commentCount: totalOf(schema.comments, eq(schema.comments.isHidden, false)),
});

export const siteLayout = (locale: ContentLocale = DEFAULT_LOCALE) => ({
  navigation: navigationSections(locale),
  statistics: siteStatistics(),
  maps: listPublishedMaps(locale),
});
