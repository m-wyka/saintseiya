import { count, desc, eq } from 'drizzle-orm';
import { authorColumns } from './authors';
import { schema, useDb } from './db';
import { pageOffset, paginated } from './pagination';

const SHOUTS_PAGE_SIZE = 30;

export const listShouts = (page: number, pageSize = SHOUTS_PAGE_SIZE) => {
  const db = useDb();
  const shouts = db
    .select({
      id: schema.shouts.id,
      bodyHtml: schema.shouts.bodyHtml,
      createdAt: schema.shouts.createdAt,
      author: authorColumns,
    })
    .from(schema.shouts)
    .innerJoin(schema.users, eq(schema.users.id, schema.shouts.authorId))
    .where(eq(schema.shouts.isHidden, false))
    .orderBy(desc(schema.shouts.createdAt), desc(schema.shouts.id))
    .limit(pageSize)
    .offset(pageOffset(page, pageSize))
    .all();
  const total =
    db.select({ total: count() }).from(schema.shouts).where(eq(schema.shouts.isHidden, false)).get()?.total ?? 0;
  const readableShouts = shouts.map((shout) => ({ ...shout, bodyHtml: markMissingImages(shout.bodyHtml) }));
  return paginated(readableShouts, total, page, pageSize);
};
