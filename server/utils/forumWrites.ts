import { asc, count, desc, eq, sql } from 'drizzle-orm';
import { hasPermission, isStaff } from '#shared/utils/roles';
import type { Account } from './accounts';
import { schema, useDb } from './db';
import type { Tx } from '../db';

const FORBIDDEN = 403;

interface ForumRef {
  id: number;
  isStaffOnly: boolean;
}

const assertCanWriteIn = (forum: ForumRef, author: Account) => {
  if (forum.isStaffOnly && !isStaff(author)) {
    throw createError({ statusCode: FORBIDDEN, statusMessage: 'ERRORS.FORUM_STAFF_ONLY' });
  }
};

const insertPost = (tx: Tx, threadId: number, forumId: number, author: Account, bodyHtml: string, now: Date) => {
  const post = tx
    .insert(schema.posts)
    .values({ threadId, authorId: author.id, bodyHtml, createdAt: now })
    .returning()
    .get();
  tx.update(schema.threads)
    .set({ postCount: sql`${schema.threads.postCount} + 1`, lastPostAt: now, lastPostAuthorId: author.id })
    .where(eq(schema.threads.id, threadId))
    .run();
  tx.update(schema.forums)
    .set({ postCount: sql`${schema.forums.postCount} + 1` })
    .where(eq(schema.forums.id, forumId))
    .run();
  return post;
};

export const findForumForWriting = (slug: string) =>
  useDb()
    .select({ id: schema.forums.id, isStaffOnly: schema.forums.isStaffOnly })
    .from(schema.forums)
    .where(eq(schema.forums.slug, slug))
    .get();

export const createThread = (forum: ForumRef, author: Account, title: string, bodyHtml: string) => {
  assertCanWriteIn(forum, author);
  const now = new Date();
  return useDb().transaction((tx) => {
    const thread = tx
      .insert(schema.threads)
      .values({
        forumId: forum.id,
        title,
        authorId: author.id,
        lastPostAt: now,
        lastPostAuthorId: author.id,
        createdAt: now,
      })
      .returning()
      .get();
    tx.update(schema.forums)
      .set({ threadCount: sql`${schema.forums.threadCount} + 1` })
      .where(eq(schema.forums.id, forum.id))
      .run();
    const post = insertPost(tx, thread.id, forum.id, author, bodyHtml, now);
    return { threadId: thread.id, postId: post.id };
  });
};

const findThreadForWriting = (threadId: number) =>
  useDb()
    .select({
      id: schema.threads.id,
      isLocked: schema.threads.isLocked,
      forum: { id: schema.forums.id, isStaffOnly: schema.forums.isStaffOnly },
    })
    .from(schema.threads)
    .innerJoin(schema.forums, eq(schema.forums.id, schema.threads.forumId))
    .where(eq(schema.threads.id, threadId))
    .get();

const findOpenThread = (threadId: number, author: Account) => {
  const thread = foundOr404(findThreadForWriting(threadId), 'ERRORS.THREAD_NOT_FOUND');
  assertCanWriteIn(thread.forum, author);
  if (thread.isLocked && !hasPermission(author, 'forum')) {
    throw createError({ statusCode: FORBIDDEN, statusMessage: 'ERRORS.THREAD_LOCKED' });
  }
  return thread;
};

export const replyToThread = (threadId: number, author: Account, bodyHtml: string) => {
  const thread = findOpenThread(threadId, author);
  const post = useDb().transaction((tx) => insertPost(tx, thread.id, thread.forum.id, author, bodyHtml, new Date()));
  return { threadId: thread.id, postId: post.id };
};

export const findEditablePost = (postId: number, editor: Account) => {
  const post = foundOr404(
    useDb().select().from(schema.posts).where(eq(schema.posts.id, postId)).get(),
    'ERRORS.POST_NOT_FOUND',
  );
  if (post.authorId !== editor.id && !hasPermission(editor, 'forum')) {
    throw createError({ statusCode: FORBIDDEN, statusMessage: 'ERRORS.POST_NOT_OWNED' });
  }
  findOpenThread(post.threadId, editor);
  return post;
};

export const editPost = (postId: number, editor: Account, bodyHtml: string) => {
  const post = findEditablePost(postId, editor);
  useDb()
    .update(schema.posts)
    .set({ bodyHtml, editedAt: new Date(), editedById: editor.id })
    .where(eq(schema.posts.id, postId))
    .run();
  return { threadId: post.threadId, postId };
};

const refreshThreadCounters = (tx: Tx, threadId: number) => {
  const inThread = eq(schema.posts.threadId, threadId);
  const latestPost = tx
    .select({ authorId: schema.posts.authorId, createdAt: schema.posts.createdAt })
    .from(schema.posts)
    .where(inThread)
    .orderBy(desc(schema.posts.createdAt), desc(schema.posts.id))
    .limit(1)
    .get();
  if (!latestPost) {
    return;
  }
  tx.update(schema.threads)
    .set({
      postCount: tx.select({ total: count() }).from(schema.posts).where(inThread).get()?.total ?? 0,
      lastPostAt: latestPost.createdAt,
      lastPostAuthorId: latestPost.authorId,
    })
    .where(eq(schema.threads.id, threadId))
    .run();
};

const refreshForumCounters = (tx: Tx, forumId: number) => {
  const totals = tx
    .select({
      threadCount: count(),
      postCount: sql<number>`coalesce(sum(${schema.threads.postCount}), 0)`,
    })
    .from(schema.threads)
    .where(eq(schema.threads.forumId, forumId))
    .get();
  tx.update(schema.forums)
    .set({ threadCount: totals?.threadCount ?? 0, postCount: totals?.postCount ?? 0 })
    .where(eq(schema.forums.id, forumId))
    .run();
};

const updateThreadFlags = (threadId: number, flags: { isLocked?: boolean; isSticky?: boolean }) =>
  foundOr404(
    useDb()
      .update(schema.threads)
      .set(flags)
      .where(eq(schema.threads.id, threadId))
      .returning({ id: schema.threads.id, isLocked: schema.threads.isLocked, isSticky: schema.threads.isSticky })
      .get(),
    'ERRORS.THREAD_NOT_FOUND',
  );

export const setThreadLocked = (threadId: number, isLocked: boolean) => updateThreadFlags(threadId, { isLocked });

export const setThreadSticky = (threadId: number, isSticky: boolean) => updateThreadFlags(threadId, { isSticky });

export const deleteThread = (threadId: number) => {
  const thread = foundOr404(findThreadForWriting(threadId), 'ERRORS.THREAD_NOT_FOUND');
  useDb().transaction((tx) => {
    tx.delete(schema.posts).where(eq(schema.posts.threadId, thread.id)).run();
    tx.delete(schema.threads).where(eq(schema.threads.id, thread.id)).run();
    refreshForumCounters(tx, thread.forum.id);
  });
  return { threadId: thread.id };
};

export const moveThread = (threadId: number, targetForumId: number) => {
  const db = useDb();
  const thread = foundOr404(findThreadForWriting(threadId), 'ERRORS.THREAD_NOT_FOUND');
  const targetForum = foundOr404(
    db
      .select({ id: schema.forums.id, slug: schema.forums.slug })
      .from(schema.forums)
      .where(eq(schema.forums.id, targetForumId))
      .get(),
    'ERRORS.FORUM_NOT_FOUND',
  );
  if (targetForum.id === thread.forum.id) {
    throw conflict('ERRORS.THREAD_ALREADY_IN_FORUM');
  }
  db.transaction((tx) => {
    tx.update(schema.threads).set({ forumId: targetForum.id }).where(eq(schema.threads.id, thread.id)).run();
    refreshForumCounters(tx, thread.forum.id);
    refreshForumCounters(tx, targetForum.id);
  });
  return { threadId: thread.id, forumSlug: targetForum.slug };
};

const firstPostIdOf = (threadId: number) =>
  useDb()
    .select({ id: schema.posts.id })
    .from(schema.posts)
    .where(eq(schema.posts.threadId, threadId))
    .orderBy(asc(schema.posts.createdAt), asc(schema.posts.id))
    .limit(1)
    .get()?.id;

export const deletePost = (postId: number) => {
  const db = useDb();
  const post = foundOr404(
    db
      .select({ id: schema.posts.id, threadId: schema.posts.threadId, forumId: schema.threads.forumId })
      .from(schema.posts)
      .innerJoin(schema.threads, eq(schema.threads.id, schema.posts.threadId))
      .where(eq(schema.posts.id, postId))
      .get(),
    'ERRORS.POST_NOT_FOUND',
  );
  if (firstPostIdOf(post.threadId) === post.id) {
    throw conflict('ERRORS.FIRST_POST_NOT_REMOVABLE');
  }
  db.transaction((tx) => {
    tx.delete(schema.posts).where(eq(schema.posts.id, post.id)).run();
    refreshThreadCounters(tx, post.threadId);
    refreshForumCounters(tx, post.forumId);
  });
  return { threadId: post.threadId, postId: post.id };
};
