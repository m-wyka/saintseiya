import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { schema, useDb } from '../../server/utils/db';
import { forumIndex, forumThreads, postLocation, POSTS_PAGE_SIZE, threadPosts } from '../../server/utils/forum';
import {
  createThread,
  deletePost,
  deleteThread,
  editPost,
  moveThread,
  replyToThread,
  setThreadLocked,
  setThreadSticky,
} from '../../server/utils/forumWrites';
import { createAccount, createForum, resetDatabase } from './fixtures';

const forumRow = (forumId: number) => useDb().select().from(schema.forums).where(eq(schema.forums.id, forumId)).get()!;
const threadRow = (threadId: number) =>
  useDb().select().from(schema.threads).where(eq(schema.threads.id, threadId)).get()!;

describe('forum writing', () => {
  beforeEach(resetDatabase);

  it('creates a thread with its first post and updates the forum counters', () => {
    const author = createAccount();
    const forum = createForum();

    const created = createThread(forum, author, 'Nowy temat', '<p>Pierwszy post</p>');

    expect(threadRow(created.threadId)).toMatchObject({
      title: 'Nowy temat',
      postCount: 1,
      lastPostAuthorId: author.id,
    });
    expect(forumRow(forum.id)).toMatchObject({ threadCount: 1, postCount: 1 });
  });

  it('adds a reply and moves the last-post marker', () => {
    const author = createAccount();
    const replier = createAccount();
    const forum = createForum();
    const { threadId } = createThread(forum, author, 'Temat', '<p>A</p>');

    replyToThread(threadId, replier, '<p>B</p>');

    expect(threadRow(threadId)).toMatchObject({ postCount: 2, lastPostAuthorId: replier.id });
    expect(forumRow(forum.id).postCount).toBe(2);
  });

  it('keeps regular users out of a locked thread but lets a forum moderator reply', () => {
    const author = createAccount();
    const moderator = createAccount({ role: 'moderator', permissions: ['forum'] });
    const forum = createForum();
    const { threadId } = createThread(forum, author, 'Temat', '<p>A</p>');
    useDb().update(schema.threads).set({ isLocked: true }).where(eq(schema.threads.id, threadId)).run();

    expect(() => replyToThread(threadId, author, '<p>B</p>')).toThrowError('ERRORS.THREAD_LOCKED');
    expect(replyToThread(threadId, moderator, '<p>B</p>').threadId).toBe(threadId);
  });

  it('lets only staff write in a staff-only forum', () => {
    const user = createAccount();
    const admin = createAccount({ role: 'admin' });
    const forum = createForum({ isStaffOnly: true });

    expect(() => createThread(forum, user, 'Temat', '<p>A</p>')).toThrowError('ERRORS.FORUM_STAFF_ONLY');
    expect(createThread(forum, admin, 'Temat', '<p>A</p>').threadId).toBeGreaterThan(0);
  });

  it('allows editing a post by its author or a forum moderator only', () => {
    const author = createAccount();
    const stranger = createAccount();
    const moderator = createAccount({ role: 'moderator', permissions: ['forum'] });
    const moderatorWithoutForum = createAccount({ role: 'moderator', permissions: ['news'] });
    const { postId } = createThread(createForum(), author, 'Temat', '<p>A</p>');

    expect(() => editPost(postId, stranger, '<p>X</p>')).toThrowError('ERRORS.POST_NOT_OWNED');
    expect(() => editPost(postId, moderatorWithoutForum, '<p>X</p>')).toThrowError('ERRORS.POST_NOT_OWNED');
    editPost(postId, author, '<p>Autor</p>');
    editPost(postId, moderator, '<p>Moderator</p>');

    const post = useDb().select().from(schema.posts).where(eq(schema.posts.id, postId)).get()!;
    expect(post).toMatchObject({ bodyHtml: '<p>Moderator</p>', editedById: moderator.id });
    expect(post.editedAt).toBeInstanceOf(Date);
  });
});

describe('forum reading', () => {
  beforeEach(resetDatabase);

  it('hides staff-only forums from visitors and regular users', () => {
    const author = createAccount({ role: 'admin' });
    createThread(createForum(), author, 'Publiczny', '<p>A</p>');
    const staffForum = createForum({ isStaffOnly: true });
    const { threadId } = createThread(staffForum, author, 'Tajny', '<p>A</p>');
    const staffViewer = { id: author.id, name: author.name, avatarUrl: null, role: 'admin' as const, permissions: [] };

    expect(forumIndex(null).flatMap((category) => category.forums)).toHaveLength(1);
    expect(forumIndex(staffViewer).flatMap((category) => category.forums)).toHaveLength(2);
    expect(forumThreads(staffForum.slug, 1, null)).toBeNull();
    expect(threadPosts(threadId, 1, null)).toBeNull();
    expect(threadPosts(threadId, 1, staffViewer)?.posts.items).toHaveLength(1);
  });

  it('lists sticky threads first and paginates posts', () => {
    const author = createAccount();
    const forum = createForum();
    const first = createThread(forum, author, 'Zwykły', '<p>A</p>');
    const sticky = createThread(forum, author, 'Przyklejony', '<p>A</p>');
    useDb()
      .update(schema.threads)
      .set({ isSticky: true, lastPostAt: new Date(2000, 0, 1) })
      .where(eq(schema.threads.id, sticky.threadId))
      .run();
    for (let reply = 0; reply < POSTS_PAGE_SIZE; reply += 1) {
      replyToThread(first.threadId, author, `<p>Odpowiedź ${reply}</p>`);
    }

    expect(forumThreads(forum.slug, 1, null)?.threads.items.map((thread) => thread.title)).toEqual([
      'Przyklejony',
      'Zwykły',
    ]);
    const secondPage = threadPosts(first.threadId, 2, null)!;
    expect(secondPage.posts).toMatchObject({ page: 2, pageCount: 2, total: POSTS_PAGE_SIZE + 1 });
    expect(secondPage.posts.items).toHaveLength(1);
  });

  it('locates the page a post is on', () => {
    const author = createAccount();
    const { threadId, postId: firstPostId } = createThread(createForum(), author, 'Temat', '<p>A</p>');
    let lastPostId = firstPostId;
    for (let reply = 0; reply < POSTS_PAGE_SIZE; reply += 1) {
      lastPostId = replyToThread(threadId, author, '<p>B</p>').postId;
    }

    expect(postLocation(firstPostId, null)).toEqual({ threadId, postId: firstPostId, page: 1 });
    expect(postLocation(lastPostId, null)).toEqual({ threadId, postId: lastPostId, page: 2 });
    expect(postLocation(999_999, null)).toBeNull();
  });
});

describe('forum moderation', () => {
  beforeEach(resetDatabase);

  const postCountIn = (threadId: number) =>
    useDb().select().from(schema.posts).where(eq(schema.posts.threadId, threadId)).all().length;

  const datePost = (postId: number, createdAt: Date) =>
    useDb().update(schema.posts).set({ createdAt }).where(eq(schema.posts.id, postId)).run();

  it('locks, unlocks, sticks and unsticks a thread', () => {
    const { threadId } = createThread(createForum(), createAccount(), 'Temat', '<p>A</p>');

    expect(setThreadLocked(threadId, true)).toMatchObject({ isLocked: true, isSticky: false });
    expect(setThreadSticky(threadId, true)).toMatchObject({ isLocked: true, isSticky: true });
    expect(setThreadLocked(threadId, false)).toMatchObject({ isLocked: false, isSticky: true });
    expect(setThreadSticky(threadId, false)).toMatchObject({ isLocked: false, isSticky: false });
    expect(() => setThreadLocked(999_999, true)).toThrowError('ERRORS.THREAD_NOT_FOUND');
  });

  it('deletes a reply and moves the counters and the last-post marker back', () => {
    const author = createAccount();
    const replier = createAccount();
    const forum = createForum();
    const firstPostDate = new Date(2021, 0, 1);
    const { threadId, postId: firstPostId } = createThread(forum, author, 'Temat', '<p>A</p>');
    const { postId: replyId } = replyToThread(threadId, replier, '<p>B</p>');
    datePost(firstPostId, firstPostDate);

    deletePost(replyId);

    expect(threadRow(threadId)).toMatchObject({
      postCount: 1,
      lastPostAuthorId: author.id,
      lastPostAt: firstPostDate,
    });
    expect(forumRow(forum.id)).toMatchObject({ threadCount: 1, postCount: 1, lastPostAt: firstPostDate });
    expect(postCountIn(threadId)).toBe(1);
  });

  it('keeps the last-post marker when an earlier reply is deleted', () => {
    const author = createAccount();
    const firstReplier = createAccount();
    const lastReplier = createAccount();
    const forum = createForum();
    const { threadId, postId: firstPostId } = createThread(forum, author, 'Temat', '<p>A</p>');
    const { postId: middlePostId } = replyToThread(threadId, firstReplier, '<p>B</p>');
    const { postId: lastPostId } = replyToThread(threadId, lastReplier, '<p>C</p>');
    datePost(firstPostId, new Date(2021, 0, 1));
    datePost(middlePostId, new Date(2021, 0, 2));
    datePost(lastPostId, new Date(2021, 0, 3));

    deletePost(middlePostId);

    expect(threadRow(threadId)).toMatchObject({
      postCount: 2,
      lastPostAuthorId: lastReplier.id,
      lastPostAt: new Date(2021, 0, 3),
    });
    expect(forumRow(forum.id).postCount).toBe(2);
  });

  it('refuses to delete the first post of a thread and a missing post', () => {
    const forum = createForum();
    const { threadId, postId } = createThread(forum, createAccount(), 'Temat', '<p>A</p>');

    expect(() => deletePost(postId)).toThrowError('ERRORS.FIRST_POST_NOT_REMOVABLE');
    expect(() => deletePost(999_999)).toThrowError('ERRORS.POST_NOT_FOUND');
    expect(threadRow(threadId).postCount).toBe(1);
    expect(forumRow(forum.id)).toMatchObject({ threadCount: 1, postCount: 1 });
  });

  it('deletes a thread with its posts and recounts the forum from the threads that stay', () => {
    const author = createAccount();
    const forum = createForum();
    const staying = createThread(forum, author, 'Zostaje', '<p>A</p>');
    const removed = createThread(forum, author, 'Do usunięcia', '<p>A</p>');
    replyToThread(removed.threadId, author, '<p>B</p>');
    replyToThread(removed.threadId, author, '<p>C</p>');
    const stayingLastPostAt = new Date(2021, 0, 1);
    useDb()
      .update(schema.threads)
      .set({ lastPostAt: stayingLastPostAt })
      .where(eq(schema.threads.id, staying.threadId))
      .run();

    deleteThread(removed.threadId);

    expect(threadRow(removed.threadId)).toBeUndefined();
    expect(postCountIn(removed.threadId)).toBe(0);
    expect(postCountIn(staying.threadId)).toBe(1);
    expect(forumRow(forum.id)).toMatchObject({ threadCount: 1, postCount: 1, lastPostAt: stayingLastPostAt });
    expect(() => deleteThread(removed.threadId)).toThrowError('ERRORS.THREAD_NOT_FOUND');
  });

  it('leaves an emptied forum with zeroed counters and no last-post date', () => {
    const forum = createForum();
    const { threadId } = createThread(forum, createAccount(), 'Jedyny', '<p>A</p>');

    deleteThread(threadId);

    expect(forumRow(forum.id)).toMatchObject({ threadCount: 0, postCount: 0, lastPostAt: null });
  });

  it('moves a thread to another forum and recounts both forums', () => {
    const author = createAccount();
    const source = createForum();
    const target = createForum();
    const staying = createThread(source, author, 'Zostaje', '<p>A</p>');
    const moved = createThread(source, author, 'Przenoszony', '<p>A</p>');
    replyToThread(moved.threadId, author, '<p>B</p>');
    createThread(target, author, 'Miejscowy', '<p>A</p>');

    expect(moveThread(moved.threadId, target.id)).toEqual({ threadId: moved.threadId, forumSlug: target.slug });

    expect(threadRow(moved.threadId)).toMatchObject({ forumId: target.id, postCount: 2 });
    expect(forumRow(source.id)).toMatchObject({
      threadCount: 1,
      postCount: 1,
      lastPostAt: threadRow(staying.threadId).lastPostAt,
    });
    expect(forumRow(target.id)).toMatchObject({ threadCount: 2, postCount: 3 });
    expect(forumThreads(target.slug, 1, null)?.threads.total).toBe(2);
  });

  it('refuses to move a thread to its own forum or to a missing one', () => {
    const forum = createForum();
    const { threadId } = createThread(forum, createAccount(), 'Temat', '<p>A</p>');

    expect(() => moveThread(threadId, forum.id)).toThrowError('ERRORS.THREAD_ALREADY_IN_FORUM');
    expect(() => moveThread(threadId, 999_999)).toThrowError('ERRORS.FORUM_NOT_FOUND');
    expect(() => moveThread(999_999, forum.id)).toThrowError('ERRORS.THREAD_NOT_FOUND');
    expect(forumRow(forum.id)).toMatchObject({ threadCount: 1, postCount: 1 });
  });
});
