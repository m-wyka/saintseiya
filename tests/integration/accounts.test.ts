import type { H3Event } from 'h3';
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { renameAccount, signInWithGoogle, turnAccountIntoGhost } from '../../server/utils/accounts';
import { schema, useDb } from '../../server/utils/db';
import { createAccount, resetDatabase } from './fixtures';

const event = {} as H3Event;

describe('accounts', () => {
  beforeEach(resetDatabase);

  it('creates a regular account on the first Google sign-in and reuses it later', () => {
    const created = signInWithGoogle(event, {
      sub: 'g-1',
      email: 'Seiya@Example.com',
      name: 'Seiya',
      picture: 'https://example.com/a.png',
    });
    const returning = signInWithGoogle(event, { sub: 'g-1', email: 'seiya@example.com', name: 'Zmienione Imię' });

    expect(created).toMatchObject({ name: 'Seiya', role: 'user', email: 'seiya@example.com', isGhost: false });
    expect(returning.id).toBe(created.id);
    expect(returning.name).toBe('Seiya');
    expect(returning.avatarUrl).toBeNull();
  });

  it('never hands a new account a nick that belongs to an archived author', () => {
    createAccount({ name: 'Hekate', isGhost: true });

    expect(signInWithGoogle(event, { sub: 'g-2', name: 'hekate' }).name).toBe('hekate 2');
    expect(signInWithGoogle(event, { sub: 'g-3', name: 'HEKATE' }).name).toBe('HEKATE 3');
  });

  it('falls back to a neutral nick when the Google name is unusable', () => {
    expect(signInWithGoogle(event, { sub: 'g-4', name: '<>' }).name).toBe('Rycerz');
    expect(signInWithGoogle(event, { sub: 'g-5' }).name).toBe('Rycerz 2');
  });

  it('promotes configured e-mail addresses to administrator', () => {
    expect(signInWithGoogle(event, { sub: 'g-6', email: 'admin@example.com', name: 'Szef' }).role).toBe('admin');
  });

  it('refuses a banned account', () => {
    const banned = signInWithGoogle(event, { sub: 'g-7', name: 'Zbanowany' });
    useDb().update(schema.users).set({ bannedAt: new Date() }).where(eq(schema.users.id, banned.id)).run();

    expect(() => signInWithGoogle(event, { sub: 'g-7', name: 'Zbanowany' })).toThrowError('ERRORS.ACCOUNT_BANNED');
  });

  it('renames an account unless the nick is taken by someone else', () => {
    const account = createAccount({ name: 'Shiryu' });
    createAccount({ name: 'Hyoga' });

    expect(renameAccount(account.id, 'Smok Shiryu')).toMatchObject({ name: 'Smok Shiryu', nameKey: 'smok shiryu' });
    expect(renameAccount(account.id, 'SMOK shiryu').name).toBe('SMOK shiryu');
    expect(() => renameAccount(account.id, 'hyoga')).toThrowError('ERRORS.USER_NAME_TAKEN');
  });

  it('turns a deleted account into an archived author without personal data', () => {
    const account = signInWithGoogle(event, {
      sub: 'g-8',
      email: 'ikki@example.com',
      name: 'Ikki',
      picture: 'https://example.com/i.png',
    });

    turnAccountIntoGhost(account.id);

    const ghost = useDb().select().from(schema.users).where(eq(schema.users.id, account.id)).get()!;
    expect(ghost).toMatchObject({
      name: 'Ikki',
      isGhost: true,
      googleId: null,
      email: null,
      avatarUrl: null,
      role: 'user',
    });
  });
});
