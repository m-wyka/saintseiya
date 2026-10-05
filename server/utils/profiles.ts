import { and, count, desc, eq } from 'drizzle-orm';
import { schema, useDb } from './db';

const LATEST_POST_COUNT = 8;
const POST_EXCERPT_LENGTH = 160;

const postCountOf = (userId: number): number =>
  useDb().select({ total: count() }).from(schema.posts).where(eq(schema.posts.authorId, userId)).get()?.total ?? 0;

const commentCountOf = (userId: number): number =>
  useDb()
    .select({ total: count() })
    .from(schema.comments)
    .where(and(eq(schema.comments.authorId, userId), eq(schema.comments.isHidden, false)))
    .get()?.total ?? 0;

const latestPublicPosts = (userId: number) =>
  useDb()
    .select({
      id: schema.posts.id,
      bodyHtml: schema.posts.bodyHtml,
      createdAt: schema.posts.createdAt,
      threadTitle: schema.threads.title,
    })
    .from(schema.posts)
    .innerJoin(schema.threads, eq(schema.threads.id, schema.posts.threadId))
    .innerJoin(schema.forums, eq(schema.forums.id, schema.threads.forumId))
    .where(and(eq(schema.posts.authorId, userId), eq(schema.forums.isStaffOnly, false)))
    .orderBy(desc(schema.posts.createdAt))
    .limit(LATEST_POST_COUNT)
    .all();

export const findProfile = (userId: number) => {
  const user = useDb()
    .select({
      id: schema.users.id,
      name: schema.users.name,
      isGhost: schema.users.isGhost,
      role: schema.users.role,
      avatarUrl: schema.users.avatarUrl,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .get();
  if (!user) {
    return null;
  }
  return {
    ...user,
    createdAt: user.isGhost ? null : user.createdAt,
    postCount: postCountOf(userId),
    commentCount: commentCountOf(userId),
    latestPosts: latestPublicPosts(userId).map(({ bodyHtml, ...post }) => ({
      ...post,
      excerpt: htmlToPlainText(bodyHtml).slice(0, POST_EXCERPT_LENGTH),
    })),
  };
};
