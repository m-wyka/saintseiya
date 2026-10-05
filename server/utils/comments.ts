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

export const listComments = (targetKind: CommentTarget, targetId: number, page: number) => {
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

const COMMENTS_ENABLED_BY_TARGET: Record<CommentTarget, (targetId: number) => boolean> = {
  news: (targetId) =>
    Boolean(
      useDb()
        .select({ id: schema.news.id })
        .from(schema.news)
        .where(
          and(eq(schema.news.id, targetId), eq(schema.news.status, 'published'), eq(schema.news.commentsEnabled, true)),
        )
        .get(),
    ),
  page: (targetId) =>
    Boolean(
      useDb()
        .select({ id: schema.pages.id })
        .from(schema.pages)
        .where(
          and(
            eq(schema.pages.id, targetId),
            eq(schema.pages.status, 'published'),
            eq(schema.pages.commentsEnabled, true),
          ),
        )
        .get(),
    ),
  photo: (targetId) =>
    Boolean(useDb().select({ id: schema.photos.id }).from(schema.photos).where(eq(schema.photos.id, targetId)).get()),
  video: (targetId) =>
    Boolean(useDb().select({ id: schema.videos.id }).from(schema.videos).where(eq(schema.videos.id, targetId)).get()),
};

export const acceptsComments = (targetKind: CommentTarget, targetId: number): boolean =>
  COMMENTS_ENABLED_BY_TARGET[targetKind](targetId);
