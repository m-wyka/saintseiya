import { count, desc, eq, gte, sql } from 'drizzle-orm';
import type { SQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core';
import { schema, useDb } from './db';

const RECENT_PERIOD_DAYS = 30;
const SECONDS_PER_DAY = 86_400;
const LATEST_MEMBER_COUNT = 6;
const TOP_AUTHOR_COUNT = 8;

interface CountedTable {
  table: SQLiteTable;
  createdAt: SQLiteColumn;
}

const COUNTED = {
  news: { table: schema.news, createdAt: schema.news.createdAt },
  pages: { table: schema.pages, createdAt: schema.pages.createdAt },
  threads: { table: schema.threads, createdAt: schema.threads.createdAt },
  posts: { table: schema.posts, createdAt: schema.posts.createdAt },
  comments: { table: schema.comments, createdAt: schema.comments.createdAt },
  photos: { table: schema.photos, createdAt: schema.photos.createdAt },
  videos: { table: schema.videos, createdAt: schema.videos.createdAt },
  shouts: { table: schema.shouts, createdAt: schema.shouts.createdAt },
} satisfies Record<string, CountedTable>;

type CountedName = keyof typeof COUNTED;

const recentPeriodStart = (): Date => new Date(Date.now() - RECENT_PERIOD_DAYS * SECONDS_PER_DAY * 1000);

const totalsOf = ({ table, createdAt }: CountedTable) => {
  const db = useDb();
  return {
    total: db.select({ total: count() }).from(table).get()?.total ?? 0,
    recent: db.select({ total: count() }).from(table).where(gte(createdAt, recentPeriodStart())).get()?.total ?? 0,
  };
};

const memberTotals = () => {
  const db = useDb();
  const active = eq(schema.users.isGhost, false);
  return {
    total: db.select({ total: count() }).from(schema.users).where(active).get()?.total ?? 0,
    recent:
      db
        .select({ total: count() })
        .from(schema.users)
        .where(sql`${active} AND ${gte(schema.users.createdAt, recentPeriodStart())}`)
        .get()?.total ?? 0,
    ghosts: db.select({ total: count() }).from(schema.users).where(eq(schema.users.isGhost, true)).get()?.total ?? 0,
  };
};

const yearlyCounts = ({ table, createdAt }: CountedTable) => {
  const year = sql<string>`strftime('%Y', ${createdAt}, 'unixepoch')`;
  const rows = useDb().select({ year, total: count() }).from(table).groupBy(year).all();
  return new Map(rows.map((row) => [Number(row.year), row.total]));
};

const yearlyActivity = (names: CountedName[]) => {
  const countsByName = new Map(names.map((name) => [name, yearlyCounts(COUNTED[name])]));
  const years = [...countsByName.values()].flatMap((counts) => [...counts.keys()]);
  if (!years.length) {
    return [];
  }
  const firstYear = Math.min(...years);
  const lastYear = Math.max(...years, new Date().getFullYear());
  return Array.from({ length: lastYear - firstYear + 1 }, (_, index) => {
    const year = firstYear + index;
    return { year, ...Object.fromEntries(names.map((name) => [name, countsByName.get(name)?.get(year) ?? 0])) } as {
      year: number;
    } & Record<CountedName, number>;
  });
};

const latestMembers = () =>
  useDb()
    .select({
      id: schema.users.id,
      name: schema.users.name,
      role: schema.users.role,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .where(eq(schema.users.isGhost, false))
    .orderBy(desc(schema.users.createdAt), desc(schema.users.id))
    .limit(LATEST_MEMBER_COUNT)
    .all();

const topForumAuthors = () =>
  useDb()
    .select({
      id: schema.users.id,
      name: schema.users.name,
      isGhost: schema.users.isGhost,
      postCount: count(schema.posts.id),
    })
    .from(schema.posts)
    .innerJoin(schema.users, eq(schema.users.id, schema.posts.authorId))
    .groupBy(schema.users.id)
    .orderBy(desc(count(schema.posts.id)))
    .limit(TOP_AUTHOR_COUNT)
    .all();

export const dashboardStatistics = () => ({
  recentPeriodDays: RECENT_PERIOD_DAYS,
  totals: {
    members: memberTotals(),
    ...(Object.fromEntries(Object.entries(COUNTED).map(([name, counted]) => [name, totalsOf(counted)])) as Record<
      CountedName,
      { total: number; recent: number }
    >),
  },
  yearlyActivity: yearlyActivity(['posts', 'comments', 'news']),
  latestMembers: latestMembers(),
  latestComments: latestComments(),
  topForumAuthors: topForumAuthors(),
});
