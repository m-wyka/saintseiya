import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { moderatedComments, removeComment, setCommentHidden } from '../../server/admin/community/comments';
import { forumCategoriesResource } from '../../server/admin/community/forumCategories';
import { forumsResource } from '../../server/admin/community/forums';
import { moderatedShouts, removeShout, setShoutHidden } from '../../server/admin/community/shouts';
import { changeAccountRole, listUsers, setAccountBan } from '../../server/admin/community/users';
import { listComments } from '../../server/utils/comments';
import { createComment, createShout } from '../../server/utils/communityWrites';
import { schema, useDb } from '../../server/utils/db';
import { createThread } from '../../server/utils/forumWrites';
import { listShouts } from '../../server/utils/shouts';
import { createAccount, createForum, createNews, resetDatabase } from './fixtures';

const everything = { page: 1, search: '', filter: '' };

const storedAccount = (accountId: number) =>
  useDb().select().from(schema.users).where(eq(schema.users.id, accountId)).get()!;

describe('comment moderation', () => {
  beforeEach(resetDatabase);

  it('lists every comment, newest first, with its author, target and a text excerpt', () => {
    const author = createAccount({ name: 'Shun' });
    const news = createNews(author.id, { title: 'Hades wraca' });
    const older = createComment('news', news.id, author, '<p>Pierwszy <strong>komentarz</strong></p>');
    const newer = createComment('news', news.id, author, '<p>Drugi komentarz</p>');
    useDb()
      .update(schema.comments)
      .set({ createdAt: new Date(2020, 0, 1) })
      .where(eq(schema.comments.id, older.id))
      .run();

    const listed = moderatedComments(everything);

    expect(listed.total).toBe(2);
    expect(listed.items.map((comment) => comment.id)).toEqual([newer.id, older.id]);
    expect(listed.items[1]).toMatchObject({
      excerpt: 'Pierwszy komentarz',
      isHidden: false,
      targetKind: 'news',
      author: { name: 'Shun', isGhost: false },
      target: { title: 'Hades wraca', url: `/newsy/${news.slug}` },
    });
  });

  it('keeps a comment listed without a link when its content is no longer public', () => {
    const author = createAccount();
    const news = createNews(author.id);
    createComment('news', news.id, author, '<p>Komentarz</p>');
    useDb().update(schema.news).set({ status: 'draft' }).where(eq(schema.news.id, news.id)).run();

    expect(moderatedComments(everything).items[0]).toMatchObject({ targetKind: 'news', target: null });
  });

  it('searches by text and filters by visibility', () => {
    const author = createAccount();
    const news = createNews(author.id);
    createComment('news', news.id, author, '<p>Pegaz jest najlepszy</p>');
    const hidden = createComment('news', news.id, author, '<p>Reklama butów</p>');
    setCommentHidden(hidden.id, true);

    expect(moderatedComments({ ...everything, search: 'pegaz' }).total).toBe(1);
    expect(moderatedComments({ ...everything, filter: 'visible' }).total).toBe(1);
    expect(moderatedComments({ ...everything, filter: 'hidden' }).items.map((comment) => comment.id)).toEqual([
      hidden.id,
    ]);
  });

  it('hides a comment from readers and brings it back', () => {
    const author = createAccount();
    const news = createNews(author.id);
    const comment = createComment('news', news.id, author, '<p>Komentarz</p>');

    expect(setCommentHidden(comment.id, true)).toEqual({ id: comment.id, isHidden: true });
    expect(listComments('news', news.id, 1).total).toBe(0);

    setCommentHidden(comment.id, false);
    expect(listComments('news', news.id, 1).total).toBe(1);
  });

  it('removes a comment and reports a missing one', () => {
    const author = createAccount();
    const comment = createComment('news', createNews(author.id).id, author, '<p>Komentarz</p>');

    expect(removeComment(comment.id)).toEqual({ id: comment.id });
    expect(moderatedComments(everything).total).toBe(0);
    expect(() => removeComment(comment.id)).toThrowError('ERRORS.COMMENT_NOT_FOUND');
    expect(() => setCommentHidden(comment.id, true)).toThrowError('ERRORS.COMMENT_NOT_FOUND');
  });
});

describe('shoutbox moderation', () => {
  beforeEach(resetDatabase);

  it('lists hidden and visible messages and filters them', () => {
    const author = createAccount();
    const visible = createShout(author, 'Cześć');
    const hidden = createShout(author, 'Spam');
    setShoutHidden(hidden.id, true);

    expect(moderatedShouts(everything).total).toBe(2);
    expect(moderatedShouts({ ...everything, filter: 'hidden' }).items).toMatchObject([
      { id: hidden.id, isHidden: true },
    ]);
    expect(moderatedShouts({ ...everything, search: 'cześć' }).items).toMatchObject([{ id: visible.id }]);
  });

  it('hides a message from the public shoutbox and brings it back', () => {
    const shout = createShout(createAccount(), 'Cześć');

    setShoutHidden(shout.id, true);
    expect(listShouts(1).total).toBe(0);

    setShoutHidden(shout.id, false);
    expect(listShouts(1).total).toBe(1);
  });

  it('removes a message and reports a missing one', () => {
    const shout = createShout(createAccount(), 'Cześć');

    expect(removeShout(shout.id)).toEqual({ id: shout.id });
    expect(moderatedShouts(everything).total).toBe(0);
    expect(() => removeShout(shout.id)).toThrowError('ERRORS.SHOUT_NOT_FOUND');
  });
});

describe('user administration', () => {
  beforeEach(resetDatabase);

  it('searches by nick regardless of letter case and filters by account state', () => {
    const admin = createAccount({ name: 'Atena', role: 'admin' });
    createAccount({ name: 'Żółty Rycerz' });
    createAccount({ name: 'Zbanowany', bannedAt: new Date() });
    createAccount({ name: 'Dawny Autor', isGhost: true });

    const namesFor = (query: Partial<typeof everything>) =>
      listUsers({ ...everything, ...query }, admin).items.map((user) => user.name);

    expect(namesFor({ search: 'żÓŁTY' })).toEqual(['Żółty Rycerz']);
    expect(namesFor({ filter: 'active' }).sort()).toEqual(['Atena', 'Żółty Rycerz']);
    expect(namesFor({ filter: 'banned' })).toEqual(['Zbanowany']);
    expect(namesFor({ filter: 'ghosts' })).toEqual(['Dawny Autor']);
    expect(namesFor({})).toHaveLength(4);
    expect(namesFor({}).at(-1)).toBe('Dawny Autor');
  });

  it('shows e-mail addresses to administrators only', () => {
    const admin = createAccount({ role: 'admin' });
    const moderator = createAccount({ role: 'moderator', permissions: ['users'] });
    const member = createAccount({ name: 'Seiya' });
    useDb().update(schema.users).set({ email: 'seiya@example.com' }).where(eq(schema.users.id, member.id)).run();

    const emailSeenBy = (viewer: typeof admin) =>
      listUsers({ ...everything, search: 'seiya' }, viewer).items.map((user) => user.email);

    expect(emailSeenBy(admin)).toEqual(['seiya@example.com']);
    expect(emailSeenBy(moderator)).toEqual([null]);
  });

  it('bans and unbans an account', () => {
    const moderator = createAccount({ role: 'moderator', permissions: ['users'] });
    const member = createAccount();

    setAccountBan(moderator, member.id, true);
    expect(storedAccount(member.id).bannedAt).toBeInstanceOf(Date);

    setAccountBan(moderator, member.id, false);
    expect(storedAccount(member.id).bannedAt).toBeNull();
  });

  it('refuses to ban oneself, an archived author or, as a moderator, an administrator', () => {
    const admin = createAccount({ role: 'admin' });
    const otherAdmin = createAccount({ role: 'admin' });
    const moderator = createAccount({ role: 'moderator', permissions: ['users'] });
    const ghost = createAccount({ isGhost: true });

    expect(() => setAccountBan(admin, admin.id, true)).toThrowError('ERRORS.CANNOT_BAN_SELF');
    expect(() => setAccountBan(admin, ghost.id, true)).toThrowError('ERRORS.DELETED_ACCOUNT_IMMUTABLE');
    expect(() => setAccountBan(moderator, admin.id, true)).toThrowError('ERRORS.ADMIN_BAN_REQUIRES_ADMIN');
    expect(() => setAccountBan(admin, 999_999, true)).toThrowError('ERRORS.USER_NOT_FOUND');
    expect(storedAccount(admin.id).bannedAt).toBeNull();

    setAccountBan(admin, otherAdmin.id, true);
    expect(storedAccount(otherAdmin.id).bannedAt).toBeInstanceOf(Date);
  });

  it('grants a moderator role with a permission set and clears it for other roles', () => {
    const admin = createAccount({ role: 'admin' });
    const member = createAccount();

    changeAccountRole(admin, member.id, { role: 'moderator', permissions: ['forum', 'comments', 'forum'] });
    expect(storedAccount(member.id)).toMatchObject({ role: 'moderator', permissions: ['forum', 'comments'] });

    changeAccountRole(admin, member.id, { role: 'admin', permissions: ['forum'] });
    expect(storedAccount(member.id)).toMatchObject({ role: 'admin', permissions: [] });

    changeAccountRole(admin, member.id, { role: 'user', permissions: ['forum'] });
    expect(storedAccount(member.id)).toMatchObject({ role: 'user', permissions: [] });
  });

  it('refuses self-demotion, demoting the last administrator and changing an archived author', () => {
    const admin = createAccount({ role: 'admin' });
    const ghost = createAccount({ isGhost: true });
    const formerAdmin = createAccount({ role: 'admin' });
    useDb().update(schema.users).set({ role: 'user' }).where(eq(schema.users.id, formerAdmin.id)).run();

    expect(() => changeAccountRole(admin, admin.id, { role: 'user', permissions: [] })).toThrowError(
      'ERRORS.CANNOT_DEMOTE_SELF',
    );
    expect(() => changeAccountRole(formerAdmin, admin.id, { role: 'user', permissions: [] })).toThrowError(
      'ERRORS.LAST_ADMIN_REQUIRED',
    );
    expect(() => changeAccountRole(admin, ghost.id, { role: 'moderator', permissions: [] })).toThrowError(
      'ERRORS.DELETED_ACCOUNT_IMMUTABLE',
    );
    expect(storedAccount(admin.id).role).toBe('admin');
    expect(storedAccount(ghost.id).role).toBe('user');
  });
});

describe('forum structure administration', () => {
  beforeEach(resetDatabase);

  const forumInput = (categoryId: number) => ({
    categoryId,
    name: 'Złoci Rycerze',
    slug: '',
    description: 'Dwunastu strażników Sanktuarium',
    isStaffOnly: false,
    sortOrder: 3,
  });

  it('creates categories and forums with a generated, unique address', () => {
    const admin = createAccount({ role: 'admin' });
    const category = forumCategoriesResource.create({ name: 'Saint Seiya', sortOrder: 1 }, admin);

    const first = forumsResource.create(forumInput(category.id), admin);
    const second = forumsResource.create(forumInput(category.id), admin);

    expect(forumsResource.find(first.id)).toMatchObject({ slug: 'zloci-rycerze', categoryId: category.id });
    expect(forumsResource.find(second.id)).toMatchObject({ slug: 'zloci-rycerze-2', sortOrder: 3 });
    expect(forumCategoriesResource.list(everything)).toMatchObject([{ name: 'Saint Seiya', forumCount: 2 }]);
  });

  it('updates a forum and keeps its own address', () => {
    const admin = createAccount({ role: 'admin' });
    const category = forumCategoriesResource.create({ name: 'Saint Seiya', sortOrder: 1 }, admin);
    const { id } = forumsResource.create(forumInput(category.id), admin);

    forumsResource.update(id, { ...forumInput(category.id), slug: 'zloci-rycerze', isStaffOnly: true }, admin);

    expect(forumsResource.find(id)).toMatchObject({ slug: 'zloci-rycerze', isStaffOnly: true });
  });

  it('rejects a forum without an existing category or with a wrong order', () => {
    const admin = createAccount({ role: 'admin' });
    const category = forumCategoriesResource.create({ name: 'Saint Seiya', sortOrder: 1 }, admin);

    expect(() => forumsResource.create(forumInput(999_999), admin)).toThrowError('VALIDATION.FORUM_CATEGORY_REQUIRED');
    expect(() => forumsResource.create({ ...forumInput(category.id), sortOrder: -1 }, admin)).toThrowError(
      'VALIDATION.SORT_ORDER_INVALID',
    );
    expect(() => forumCategoriesResource.create({ name: 'A', sortOrder: 0 }, admin)).toThrowError(
      'VALIDATION.NAME_TOO_SHORT',
    );
  });

  it('refuses to remove a forum with threads and a category with forums', () => {
    const admin = createAccount({ role: 'admin' });
    const forum = createForum();
    createThread(forum, admin, 'Temat', '<p>A</p>');

    expect(() => forumsResource.remove(forum.id, admin)).toThrowError('ERRORS.FORUM_HAS_THREADS');
    expect(() => forumCategoriesResource.remove(forum.categoryId, admin)).toThrowError(
      'ERRORS.FORUM_CATEGORY_HAS_FORUMS',
    );
    expect(forumsResource.find(forum.id)).toBeDefined();
    expect(useDb().select().from(schema.threads).all()).toHaveLength(1);
  });

  it('removes an empty forum and then its empty category', () => {
    const admin = createAccount({ role: 'admin' });
    const forum = createForum();

    forumsResource.remove(forum.id, admin);
    forumCategoriesResource.remove(forum.categoryId, admin);

    expect(forumsResource.find(forum.id)).toBeUndefined();
    expect(forumCategoriesResource.find(forum.categoryId)).toBeUndefined();
  });
});
