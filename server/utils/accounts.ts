import { eq } from 'drizzle-orm';
import type { H3Event } from 'h3';
import type { User as SessionUser } from '#auth-utils';
import { hasPermission } from '#shared/utils/roles';
import type { ModeratorPermission } from '#shared/utils/roles';
import { fitUserName, userNameKey } from '#shared/utils/users';
import { schema, useDb } from './db';

const NEW_USER_NAME_FALLBACK = 'Rycerz';
const FORBIDDEN = 403;
const UNAUTHORIZED = 401;
const CONFLICT = 409;

export interface GoogleProfile {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
}

export type Account = typeof schema.users.$inferSelect;

const isNameTaken = (name: string, exceptUserId?: number): boolean => {
  const owner = useDb()
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.nameKey, userNameKey(name)))
    .get();
  return Boolean(owner) && owner?.id !== exceptUserId;
};

const firstFreeName = (wantedName: string): string => {
  if (!isNameTaken(wantedName)) {
    return wantedName;
  }
  let suffix = 2;
  while (isNameTaken(`${wantedName} ${suffix}`)) {
    suffix += 1;
  }
  return `${wantedName} ${suffix}`;
};

const adminEmailsOf = (event: H3Event): string[] =>
  String(useRuntimeConfig(event).adminEmails ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

export const sessionUserOf = (account: Account): SessionUser => ({
  id: account.id,
  name: account.name,
  avatarUrl: account.avatarUrl,
  role: account.role,
  permissions: account.permissions,
});

const assertNotBanned = (account: Account) => {
  if (account.bannedAt) {
    throw createError({ statusCode: FORBIDDEN, statusMessage: 'To konto zostało zablokowane' });
  }
};

export const signInWithGoogle = (event: H3Event, profile: GoogleProfile): Account => {
  const db = useDb();
  const email = profile.email?.trim().toLowerCase() ?? null;
  const isBootstrapAdmin = email !== null && adminEmailsOf(event).includes(email);
  const existing = db.select().from(schema.users).where(eq(schema.users.googleId, profile.sub)).get();
  const now = new Date();

  if (existing) {
    assertNotBanned(existing);
    return db
      .update(schema.users)
      .set({
        email,
        avatarUrl: profile.picture ?? null,
        lastSeenAt: now,
        role: isBootstrapAdmin ? 'admin' : existing.role,
      })
      .where(eq(schema.users.id, existing.id))
      .returning()
      .get();
  }

  const name = firstFreeName(fitUserName(profile.name ?? '', NEW_USER_NAME_FALLBACK));
  return db
    .insert(schema.users)
    .values({
      googleId: profile.sub,
      email,
      name,
      nameKey: userNameKey(name),
      avatarUrl: profile.picture ?? null,
      role: isBootstrapAdmin ? 'admin' : 'user',
      lastSeenAt: now,
    })
    .returning()
    .get();
};

export const findActiveAccount = (accountId: number): Account | null => {
  const account = useDb().select().from(schema.users).where(eq(schema.users.id, accountId)).get();
  return account && !account.isGhost && !account.bannedAt ? account : null;
};

export const requireAccount = async (event: H3Event): Promise<Account> => {
  const session = await requireUserSession(event);
  const account = useDb().select().from(schema.users).where(eq(schema.users.id, session.user.id)).get();
  if (!account || account.isGhost) {
    await clearUserSession(event);
    throw createError({ statusCode: UNAUTHORIZED, statusMessage: 'Zaloguj się ponownie' });
  }
  if (account.bannedAt) {
    await clearUserSession(event);
    assertNotBanned(account);
  }
  return account;
};

export const requirePermission = async (event: H3Event, permission: ModeratorPermission): Promise<Account> => {
  const account = await requireAccount(event);
  if (!hasPermission(account, permission)) {
    throw createError({ statusCode: FORBIDDEN, statusMessage: 'Brak uprawnień' });
  }
  return account;
};

export const requireAdmin = async (event: H3Event): Promise<Account> => {
  const account = await requireAccount(event);
  if (account.role !== 'admin') {
    throw createError({ statusCode: FORBIDDEN, statusMessage: 'Brak uprawnień' });
  }
  return account;
};

export const renameAccount = (accountId: number, name: string): Account => {
  if (isNameTaken(name, accountId)) {
    throw createError({ statusCode: CONFLICT, statusMessage: 'Ten nick jest już zajęty' });
  }
  return useDb()
    .update(schema.users)
    .set({ name, nameKey: userNameKey(name) })
    .where(eq(schema.users.id, accountId))
    .returning()
    .get();
};

export const turnAccountIntoGhost = (accountId: number) => {
  useDb()
    .update(schema.users)
    .set({ googleId: null, email: null, avatarUrl: null, isGhost: true, role: 'user', permissions: [] })
    .where(eq(schema.users.id, accountId))
    .run();
};
