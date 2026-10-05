import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { setCommentHidden, removeComment } from '../../server/admin/community/comments';
import { changeAccountRole } from '../../server/admin/community/users';
import { signInWithGoogle, turnAccountIntoGhost } from '../../server/utils/accounts';
import { audited, describeChanges, listAuditLog, recordAudit } from '../../server/utils/auditLog';
import { createComment } from '../../server/utils/communityWrites';
import { schema } from '../../server/utils/db';
import { storeTranslations } from '../../server/utils/translations';
import { AUDIT_ACTIONS, AUDIT_ENTITIES, auditActionLabelKey, auditEntityLabelKey } from '../../shared/utils/audit';
import { createAccount, createAlbum, createNews, createPhoto, resetDatabase } from './fixtures';

const everything = { page: 1, search: '', filter: '', entity: '' };
const noEvent = {} as Parameters<typeof signInWithGoogle>[0];

describe('describing what changed', () => {
  it('lists only the fields whose value differs', () => {
    const before = { id: 1, title: 'Hades', status: 'draft', tagIds: [], updatedAt: new Date(2020, 0, 1) };
    const after = { id: 1, title: 'Hades wraca', status: 'draft', tagIds: [3], updatedAt: new Date(2024, 0, 1) };

    expect(describeChanges(before, after)).toEqual([
      { field: 'title', before: 'Hades', after: 'Hades wraca' },
      { field: 'tagIds', before: null, after: '[3]' },
    ]);
  });

  it('never copies contact data or visit counters', () => {
    const before = { email: 'seiya@example.com', googleId: 'g-1', viewCount: 1, role: 'user' };
    const after = { email: null, googleId: null, viewCount: 9, role: 'admin' };

    expect(describeChanges(before, after)).toEqual([{ field: 'role', before: 'user', after: 'admin' }]);
  });

  it('shows the neighbourhood of the change in a long text', () => {
    const lead = 'a'.repeat(2000);
    const [change] = describeChanges({ bodyHtml: `${lead}Seiya` }, { bodyHtml: `${lead}Shiryu` });

    expect(change!.before).toMatch(/^…a+Seiya$/);
    expect(change!.after).toMatch(/^…a+Shiryu$/);
    expect(change!.after!.length).toBeLessThan(450);
  });
});

describe('audit log', () => {
  beforeEach(resetDatabase);

  it('records who changed what, with the values before and after', async () => {
    const moderator = createAccount({ name: 'Shaka', role: 'moderator', permissions: ['comments'] });
    const news = createNews(moderator.id);
    const comment = createComment('news', news.id, moderator, '<p>Reklama butów</p>');

    await audited({ actor: moderator, table: schema.comments, id: comment.id }, () =>
      setCommentHidden(comment.id, true),
    );

    const listed = listAuditLog(everything);
    expect(listed.total).toBe(1);
    expect(listed.items[0]).toMatchObject({
      actorId: moderator.id,
      actorName: 'Shaka',
      actorRole: 'moderator',
      action: 'update',
      entity: 'comments',
      entityId: comment.id,
      label: 'Reklama butów',
      locale: null,
      changes: [{ field: 'isHidden', before: 'false', after: 'true' }],
    });
    expect(listed.items[0]!.createdAt).toBeInstanceOf(Date);
  });

  it('records a deletion with the content that was removed', async () => {
    const moderator = createAccount({ role: 'admin' });
    const news = createNews(moderator.id);
    const comment = createComment('news', news.id, moderator, '<p>Spam</p>');

    await audited({ actor: moderator, table: schema.comments, id: comment.id }, () => removeComment(comment.id));

    const [entry] = listAuditLog(everything).items;
    expect(entry).toMatchObject({ action: 'delete', entity: 'comments', label: 'Spam' });
    expect(entry!.changes).toContainEqual({ field: 'bodyHtml', before: '<p>Spam</p>', after: null });
  });

  it('skips a save that changed nothing and a change that failed', async () => {
    const admin = createAccount({ role: 'admin' });
    const news = createNews(admin.id);
    const comment = createComment('news', news.id, admin, '<p>Komentarz</p>');

    await audited({ actor: admin, table: schema.comments, id: comment.id }, () => setCommentHidden(comment.id, false));
    await expect(
      audited({ actor: admin, table: schema.users, id: admin.id }, () =>
        changeAccountRole(admin, admin.id, { role: 'user', permissions: [] }),
      ),
    ).rejects.toMatchObject({ statusMessage: 'ERRORS.CANNOT_DEMOTE_SELF' });

    expect(listAuditLog(everything).total).toBe(0);
  });

  it('records a translation edit under its language', async () => {
    const admin = createAccount({ role: 'admin' });
    const photo = createPhoto(createAlbum().id, { title: 'Pegaz' });

    await audited({ actor: admin, table: schema.photos, id: photo.id, locale: 'en' }, () =>
      storeTranslations(
        { table: schema.photos, fields: { title: 'text' } },
        photo.id,
        { title: 'Pegasus' },
        photo,
        'en',
      ),
    );

    expect(listAuditLog(everything).items[0]).toMatchObject({
      locale: 'en',
      label: 'Pegasus',
      changes: [{ field: 'title', before: 'Pegaz', after: 'Pegasus' }],
    });
  });

  it('records registration, sign-in and account removal without the e-mail address', async () => {
    const account = signInWithGoogle(noEvent, { sub: 'g-1', email: 'ikki@example.com', name: 'Ikki' });
    signInWithGoogle(noEvent, { sub: 'g-1', email: 'ikki@example.com', name: 'Ikki' });
    await audited({ actor: account, table: schema.users, id: account.id }, () => turnAccountIntoGhost(account.id));

    const entries = listAuditLog(everything).items;
    expect(entries.map((entry) => entry.action)).toEqual(['update', 'sign_in', 'register']);
    expect(entries[0]!.changes).toEqual([{ field: 'isGhost', before: 'false', after: 'true' }]);
    expect(JSON.stringify(entries)).not.toContain('ikki@example.com');
  });

  it('records a role granted at sign-in to an address from the administrator list', () => {
    signInWithGoogle(noEvent, { sub: 'g-2', email: 'hyoga@example.com', name: 'Hyoga' });
    const promoted = signInWithGoogle(noEvent, { sub: 'g-2', email: 'admin@example.com', name: 'Hyoga' });

    expect(promoted.role).toBe('admin');
    expect(listAuditLog({ ...everything, filter: 'update' }).items[0]!.changes).toEqual([
      { field: 'role', before: 'user', after: 'admin' },
    ]);
  });

  it('filters by action and section and searches by nickname or item name', () => {
    const saori = createAccount({ name: 'Saori', role: 'admin' });
    const shion = createAccount({ name: 'Shion', role: 'admin' });
    recordAudit(saori, { action: 'create', entity: 'news', entityId: 1, after: { title: 'Turniej Galaktyczny' } });
    recordAudit(shion, { action: 'delete', entity: 'tags', entityId: 2, before: { name: 'Sanktuarium' } });

    expect(listAuditLog({ ...everything, filter: 'delete' }).items.map((entry) => entry.entity)).toEqual(['tags']);
    expect(listAuditLog({ ...everything, entity: 'news' }).items.map((entry) => entry.actorName)).toEqual(['Saori']);
    expect(listAuditLog({ ...everything, search: 'shion' }).total).toBe(1);
    expect(listAuditLog({ ...everything, search: 'turniej' }).total).toBe(1);
    expect(listAuditLog(everything).items.map((entry) => entry.entity)).toEqual(['tags', 'news']);
  });
});

describe('audit log texts', () => {
  it('names every action and section in the interface', () => {
    const polish = JSON.parse(readFileSync('i18n/locales/pl.json', 'utf8')) as Record<string, string>;
    const labelKeys = [...AUDIT_ACTIONS.map(auditActionLabelKey), ...AUDIT_ENTITIES.map(auditEntityLabelKey)];

    expect(labelKeys.filter((key) => !(key in polish))).toEqual([]);
  });
});
