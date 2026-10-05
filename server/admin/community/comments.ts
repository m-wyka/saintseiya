import { and, count, desc, eq, like } from 'drizzle-orm';
import type { AdminListQuery } from '../../utils/adminResource';
import { visibilityFilter } from './visibility';

const COMMENTS_PAGE_SIZE = 30;
const EXCERPT_LENGTH = 200;
const COMMENT_NOT_FOUND = 'Nie znaleziono komentarza';

export const moderatedComments = ({ page, search, filter }: AdminListQuery) => {
  const db = useDb();
  const where = and(
    search ? like(schema.comments.bodyHtml, `%${search}%`) : undefined,
    visibilityFilter(schema.comments.isHidden, filter),
  );
  const comments = db
    .select({
      id: schema.comments.id,
      targetKind: schema.comments.targetKind,
      targetId: schema.comments.targetId,
      bodyHtml: schema.comments.bodyHtml,
      isHidden: schema.comments.isHidden,
      createdAt: schema.comments.createdAt,
      author: authorColumns,
    })
    .from(schema.comments)
    .innerJoin(schema.users, eq(schema.users.id, schema.comments.authorId))
    .where(where)
    .orderBy(desc(schema.comments.createdAt), desc(schema.comments.id))
    .limit(COMMENTS_PAGE_SIZE)
    .offset(pageOffset(page, COMMENTS_PAGE_SIZE))
    .all();
  const total = db.select({ total: count() }).from(schema.comments).where(where).get()?.total ?? 0;
  const targetOf = describeCommentTargets(comments);
  const items = comments.map(({ bodyHtml, ...comment }) => ({
    ...comment,
    excerpt: htmlToPlainText(bodyHtml).slice(0, EXCERPT_LENGTH),
    target: targetOf(comment) ?? null,
  }));
  return paginated(items, total, page, COMMENTS_PAGE_SIZE);
};

export const setCommentHidden = (commentId: number, isHidden: boolean) =>
  foundOr404(
    useDb()
      .update(schema.comments)
      .set({ isHidden })
      .where(eq(schema.comments.id, commentId))
      .returning({ id: schema.comments.id, isHidden: schema.comments.isHidden })
      .get(),
    COMMENT_NOT_FOUND,
  );

export const removeComment = (commentId: number) =>
  foundOr404(
    useDb()
      .delete(schema.comments)
      .where(eq(schema.comments.id, commentId))
      .returning({ id: schema.comments.id })
      .get(),
    COMMENT_NOT_FOUND,
  );
