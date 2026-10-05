import type { H3Event } from 'h3';
import { canAccess } from '#shared/utils/roles';
import type { AdminAccess } from '#shared/utils/roles';
import type { Account } from './accounts';

const FORBIDDEN = 403;

export const requireAdminAccess = async (event: H3Event, access: AdminAccess): Promise<Account> => {
  const account = await requireAccount(event);
  if (!canAccess(account, access)) {
    throw createError({ statusCode: FORBIDDEN, statusMessage: 'Brak uprawnień' });
  }
  return account;
};
