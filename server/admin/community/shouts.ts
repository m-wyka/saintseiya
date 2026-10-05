import { and, count, desc, eq, like } from 'drizzle-orm';
import type { AdminListQuery } from '../../utils/adminResource';
import { visibilityFilter } from './visibility';

const SHOUTS_PAGE_SIZE = 40;
const SHOUT_NOT_FOUND = 'Nie znaleziono wpisu';

export const moderatedShouts = ({ page, search, filter }: AdminListQuery) => {
  const db = useDb();
  const where = and(
    search ? like(schema.shouts.bodyHtml, `%${search}%`) : undefined,
    visibilityFilter(schema.shouts.isHidden, filter),
  );
  const shouts = db
    .select({
      id: schema.shouts.id,
      bodyHtml: schema.shouts.bodyHtml,
      isHidden: schema.shouts.isHidden,
      createdAt: schema.shouts.createdAt,
      author: authorColumns,
    })
    .from(schema.shouts)
    .innerJoin(schema.users, eq(schema.users.id, schema.shouts.authorId))
    .where(where)
    .orderBy(desc(schema.shouts.createdAt), desc(schema.shouts.id))
    .limit(SHOUTS_PAGE_SIZE)
    .offset(pageOffset(page, SHOUTS_PAGE_SIZE))
    .all();
  const total = db.select({ total: count() }).from(schema.shouts).where(where).get()?.total ?? 0;
  return paginated(shouts, total, page, SHOUTS_PAGE_SIZE);
};

export const setShoutHidden = (shoutId: number, isHidden: boolean) =>
  foundOr404(
    useDb()
      .update(schema.shouts)
      .set({ isHidden })
      .where(eq(schema.shouts.id, shoutId))
      .returning({ id: schema.shouts.id, isHidden: schema.shouts.isHidden })
      .get(),
    SHOUT_NOT_FOUND,
  );

export const removeShout = (shoutId: number) =>
  foundOr404(
    useDb().delete(schema.shouts).where(eq(schema.shouts.id, shoutId)).returning({ id: schema.shouts.id }).get(),
    SHOUT_NOT_FOUND,
  );
