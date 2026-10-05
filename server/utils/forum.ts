import { and, asc, count, desc, eq, lt, max, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import { authorColumns } from './authors';
import { schema, useDb } from './db';
import { pageOffset, paginated } from './pagination';
import { qualified } from './sqlHelpers';
import { seesStaffContent } from './viewer';
import type { Viewer } from './viewer';

export const THREADS_PAGE_SIZE = 25;
export const POSTS_PAGE_SIZE = 20;

const lastPostAuthors = alias(schema.users, 'last_post_authors');

const lastPostAuthorColumns = {
  id: lastPostAuthors.id,
  name: lastPostAuthors.name,
  isGhost: lastPostAuthors.isGhost,
};

const visibleForumFilter = (viewer: Viewer) =>
  seesStaffContent(viewer) ? undefined : eq(schema.forums.isStaffOnly, false);

const latestThreadByForum = () => {
  const rows = useDb()
    .select({
      forumId: schema.threads.forumId,
      id: schema.threads.id,
      title: schema.threads.title,
      lastPostAt: max(schema.threads.lastPostAt),
      authorName: lastPostAuthors.name,
    })
    .from(schema.threads)
    .leftJoin(lastPostAuthors, eq(lastPostAuthors.id, schema.threads.lastPostAuthorId))
    .groupBy(schema.threads.forumId)
    .all();
  return new Map(rows.map(({ forumId, ...thread }) => [forumId, thread]));
};

export const forumIndex = (viewer: Viewer) => {
  const db = useDb();
  const categories = db.select().from(schema.forumCategories).orderBy(asc(schema.forumCategories.sortOrder)).all();
  const forums = db
    .select({
      id: schema.forums.id,
      categoryId: schema.forums.categoryId,
      slug: schema.forums.slug,
      name: schema.forums.name,
      description: schema.forums.description,
      isStaffOnly: schema.forums.isStaffOnly,
      threadCount: schema.forums.threadCount,
      postCount: schema.forums.postCount,
    })
    .from(schema.forums)
    .where(visibleForumFilter(viewer))
    .orderBy(asc(schema.forums.sortOrder), asc(schema.forums.id))
    .all();
  const latestThreads = latestThreadByForum();
  const forumsByCategory = Map.groupBy(forums, (forum) => forum.categoryId);
  return categories
    .map((category) => ({
      id: category.id,
      name: category.name,
      forums: (forumsByCategory.get(category.id) ?? []).map(({ categoryId: _categoryId, ...forum }) => ({
        ...forum,
        latestThread: latestThreads.get(forum.id) ?? null,
      })),
    }))
    .filter((category) => category.forums.length > 0);
};

const findVisibleForum = (slug: string, viewer: Viewer) =>
  useDb()
    .select({
      id: schema.forums.id,
      slug: schema.forums.slug,
      name: schema.forums.name,
      description: schema.forums.description,
      isStaffOnly: schema.forums.isStaffOnly,
      categoryName: schema.forumCategories.name,
    })
    .from(schema.forums)
    .innerJoin(schema.forumCategories, eq(schema.forumCategories.id, schema.forums.categoryId))
    .where(and(eq(schema.forums.slug, slug), visibleForumFilter(viewer)))
    .get();

export const forumThreads = (slug: string, page: number, viewer: Viewer) => {
  const forum = findVisibleForum(slug, viewer);
  if (!forum) {
    return null;
  }
  const db = useDb();
  const threads = db
    .select({
      id: schema.threads.id,
      title: schema.threads.title,
      isSticky: schema.threads.isSticky,
      isLocked: schema.threads.isLocked,
      viewCount: schema.threads.viewCount,
      postCount: schema.threads.postCount,
      lastPostAt: schema.threads.lastPostAt,
      createdAt: schema.threads.createdAt,
      author: authorColumns,
      lastPostAuthor: lastPostAuthorColumns,
    })
    .from(schema.threads)
    .innerJoin(schema.users, eq(schema.users.id, schema.threads.authorId))
    .leftJoin(lastPostAuthors, eq(lastPostAuthors.id, schema.threads.lastPostAuthorId))
    .where(eq(schema.threads.forumId, forum.id))
    .orderBy(desc(schema.threads.isSticky), desc(schema.threads.lastPostAt), desc(schema.threads.id))
    .limit(THREADS_PAGE_SIZE)
    .offset(pageOffset(page, THREADS_PAGE_SIZE))
    .all();
  const total =
    db.select({ total: count() }).from(schema.threads).where(eq(schema.threads.forumId, forum.id)).get()?.total ?? 0;
  return { forum, threads: paginated(threads, total, page, THREADS_PAGE_SIZE) };
};

export const findVisibleThread = (threadId: number, viewer: Viewer) =>
  useDb()
    .select({
      id: schema.threads.id,
      title: schema.threads.title,
      isSticky: schema.threads.isSticky,
      isLocked: schema.threads.isLocked,
      viewCount: schema.threads.viewCount,
      postCount: schema.threads.postCount,
      forum: { id: schema.forums.id, slug: schema.forums.slug, name: schema.forums.name },
    })
    .from(schema.threads)
    .innerJoin(schema.forums, eq(schema.forums.id, schema.threads.forumId))
    .where(and(eq(schema.threads.id, threadId), visibleForumFilter(viewer)))
    .get();

const authorPostCount = sql<number>`(
  SELECT COUNT(*) FROM ${schema.posts} AS authored WHERE authored.author_id = ${qualified(schema.users.id)}
)`;

export const threadPosts = (threadId: number, page: number, viewer: Viewer) => {
  const thread = findVisibleThread(threadId, viewer);
  if (!thread) {
    return null;
  }
  const posts = useDb()
    .select({
      id: schema.posts.id,
      bodyHtml: schema.posts.bodyHtml,
      createdAt: schema.posts.createdAt,
      editedAt: schema.posts.editedAt,
      author: { ...authorColumns, postCount: authorPostCount },
    })
    .from(schema.posts)
    .innerJoin(schema.users, eq(schema.users.id, schema.posts.authorId))
    .where(eq(schema.posts.threadId, threadId))
    .orderBy(asc(schema.posts.createdAt), asc(schema.posts.id))
    .limit(POSTS_PAGE_SIZE)
    .offset(pageOffset(page, POSTS_PAGE_SIZE))
    .all();
  const readablePosts = posts.map((post) => ({ ...post, bodyHtml: markMissingImages(post.bodyHtml) }));
  return { thread, posts: paginated(readablePosts, thread.postCount, page, POSTS_PAGE_SIZE) };
};

export const countThreadView = (threadId: number) => {
  useDb()
    .update(schema.threads)
    .set({ viewCount: sql`${schema.threads.viewCount} + 1` })
    .where(eq(schema.threads.id, threadId))
    .run();
};

export const postLocation = (postId: number, viewer: Viewer) => {
  const db = useDb();
  const post = db
    .select({ id: schema.posts.id, threadId: schema.posts.threadId, createdAt: schema.posts.createdAt })
    .from(schema.posts)
    .where(eq(schema.posts.id, postId))
    .get();
  if (!post || !findVisibleThread(post.threadId, viewer)) {
    return null;
  }
  const earlierPosts =
    db
      .select({ total: count() })
      .from(schema.posts)
      .where(
        and(
          eq(schema.posts.threadId, post.threadId),
          or(
            lt(schema.posts.createdAt, post.createdAt),
            and(eq(schema.posts.createdAt, post.createdAt), lt(schema.posts.id, post.id)),
          ),
        ),
      )
      .get()?.total ?? 0;
  return { threadId: post.threadId, postId: post.id, page: Math.floor(earlierPosts / POSTS_PAGE_SIZE) + 1 };
};
