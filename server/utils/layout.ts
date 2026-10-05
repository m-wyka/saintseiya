import { asc, count, eq } from 'drizzle-orm';
import { schema, useDb } from './db';

const navigationSections = () => {
  const db = useDb();
  const sections = db.select().from(schema.navigationSections).orderBy(asc(schema.navigationSections.sortOrder)).all();
  const links = db
    .select()
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

export const siteLayout = () => ({
  navigation: navigationSections(),
  statistics: siteStatistics(),
  maps: listPublishedMaps(),
});
