import { and, asc, count, eq } from 'drizzle-orm';
import type { CommentTarget } from '#shared/utils/content';
import { authorColumns } from './authors';
import { schema, useDb } from './db';
import { pageOffset, paginated } from './pagination';

const COMMENTS_PAGE_SIZE = 30;

const visibleCommentsOf = (targetKind: CommentTarget, targetId: number) =>
  and(
    eq(schema.comments.targetKind, targetKind),
    eq(schema.comments.targetId, targetId),
    eq(schema.comments.isHidden, false),
  );

const publishedTarget = (table: typeof schema.news | typeof schema.pages, targetId: number) =>
  useDb()
    .select({ commentsEnabled: table.commentsEnabled })
    .from(table)
    .where(and(eq(table.id, targetId), eq(table.status, 'published')))
    .get();

const existingTarget = (table: typeof schema.photos | typeof schema.videos, targetId: number) =>
  useDb().select({ id: table.id }).from(table).where(eq(table.id, targetId)).get() && { commentsEnabled: true };

const PUBLIC_TARGET_LOOKUPS: Record<CommentTarget, (targetId: number) => { commentsEnabled: boolean } | undefined> = {
  news: (targetId) => publishedTarget(schema.news, targetId),
  page: (targetId) => publishedTarget(schema.pages, targetId),
  photo: (targetId) => existingTarget(schema.photos, targetId),
  video: (targetId) => existingTarget(schema.videos, targetId),
};

export const acceptsComments = (targetKind: CommentTarget, targetId: number): boolean =>
  PUBLIC_TARGET_LOOKUPS[targetKind](targetId)?.commentsEnabled ?? false;

export const listComments = (targetKind: CommentTarget, targetId: number, page: number) => {
  if (!PUBLIC_TARGET_LOOKUPS[targetKind](targetId)) {
    return paginated([], 0, page, COMMENTS_PAGE_SIZE);
  }
  const db = useDb();
  const filter = visibleCommentsOf(targetKind, targetId);
  const comments = db
    .select({
      id: schema.comments.id,
      bodyHtml: schema.comments.bodyHtml,
      createdAt: schema.comments.createdAt,
      author: authorColumns,
    })
    .from(schema.comments)
    .innerJoin(schema.users, eq(schema.users.id, schema.comments.authorId))
    .where(filter)
    .orderBy(asc(schema.comments.createdAt), asc(schema.comments.id))
    .limit(COMMENTS_PAGE_SIZE)
    .offset(pageOffset(page, COMMENTS_PAGE_SIZE))
    .all();
  const total = db.select({ total: count() }).from(schema.comments).where(filter).get()?.total ?? 0;
  const readableComments = comments.map((comment) => ({ ...comment, bodyHtml: markMissingImages(comment.bodyHtml) }));
  return paginated(readableComments, total, page, COMMENTS_PAGE_SIZE);
};
