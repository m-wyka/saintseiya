import { and, asc, count, desc, eq, isNotNull, isNull, like } from 'drizzle-orm';
import { z } from 'zod';
import { MODERATOR_PERMISSIONS, USER_ROLES } from '#shared/utils/roles';
import { userNameKey } from '#shared/utils/users';
import type { Account } from '../../utils/accounts';
import type { AdminListQuery } from '../../utils/adminResource';

const USERS_PAGE_SIZE = 30;
const FORBIDDEN = 403;

export const banInputSchema = z.object({ isBanned: z.boolean('VALIDATION.BAN_FLAG_REQUIRED') });

export const roleInputSchema = z.object({
  role: z.enum(USER_ROLES, 'VALIDATION.ROLE_UNKNOWN'),
  permissions: z
    .array(z.enum(MODERATOR_PERMISSIONS, 'VALIDATION.PERMISSION_UNKNOWN'))
    .max(MODERATOR_PERMISSIONS.length)
    .default([]),
});

type RoleInput = z.infer<typeof roleInputSchema>;

const statusFilter = (filter: string) => {
  if (filter === 'active') {
    return and(eq(schema.users.isGhost, false), isNull(schema.users.bannedAt));
  }
  if (filter === 'banned') {
    return isNotNull(schema.users.bannedAt);
  }
  if (filter === 'ghosts') {
    return eq(schema.users.isGhost, true);
  }
  return undefined;
};

export const listUsers = ({ page, search, filter }: AdminListQuery, viewer: Account) => {
  const db = useDb();
  const where = and(search ? like(schema.users.nameKey, `%${userNameKey(search)}%`) : undefined, statusFilter(filter));
  const users = db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      role: schema.users.role,
      permissions: schema.users.permissions,
      isGhost: schema.users.isGhost,
      bannedAt: schema.users.bannedAt,
      lastSeenAt: schema.users.lastSeenAt,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .where(where)
    .orderBy(asc(schema.users.isGhost), desc(schema.users.createdAt), desc(schema.users.id))
    .limit(USERS_PAGE_SIZE)
    .offset(pageOffset(page, USERS_PAGE_SIZE))
    .all();
  const total = db.select({ total: count() }).from(schema.users).where(where).get()?.total ?? 0;
  const seesEmails = viewer.role === 'admin';
  const items = users.map((user) => ({ ...user, email: seesEmails ? user.email : null }));
  return paginated(items, total, page, USERS_PAGE_SIZE);
};

const findEditableAccount = (userId: number): Account => {
  const account = foundOr404(
    useDb().select().from(schema.users).where(eq(schema.users.id, userId)).get(),
    'ERRORS.USER_NOT_FOUND',
  );
  if (account.isGhost) {
    throw conflict('ERRORS.INACTIVE_ACCOUNT_IMMUTABLE');
  }
  return account;
};

export const setAccountBan = (actor: Account, userId: number, isBanned: boolean) => {
  const target = findEditableAccount(userId);
  if (target.id === actor.id) {
    throw conflict('ERRORS.CANNOT_BAN_SELF');
  }
  if (target.role === 'admin' && actor.role !== 'admin') {
    throw createError({ statusCode: FORBIDDEN, statusMessage: 'ERRORS.ADMIN_BAN_REQUIRES_ADMIN' });
  }
  return useDb()
    .update(schema.users)
    .set({ bannedAt: isBanned ? (target.bannedAt ?? new Date()) : null })
    .where(eq(schema.users.id, target.id))
    .returning({ id: schema.users.id, bannedAt: schema.users.bannedAt })
    .get();
};

const administratorCount = (): number =>
  useDb().select({ total: count() }).from(schema.users).where(eq(schema.users.role, 'admin')).get()?.total ?? 0;

export const changeAccountRole = (actor: Account, userId: number, input: RoleInput) => {
  const target = findEditableAccount(userId);
  const losesAdministratorRole = target.role === 'admin' && input.role !== 'admin';
  if (losesAdministratorRole && target.id === actor.id) {
    throw conflict('ERRORS.CANNOT_DEMOTE_SELF');
  }
  if (losesAdministratorRole && administratorCount() <= 1) {
    throw conflict('ERRORS.LAST_ADMIN_REQUIRED');
  }
  return useDb()
    .update(schema.users)
    .set({ role: input.role, permissions: input.role === 'moderator' ? [...new Set(input.permissions)] : [] })
    .where(eq(schema.users.id, target.id))
    .returning({ id: schema.users.id, role: schema.users.role, permissions: schema.users.permissions })
    .get();
};
