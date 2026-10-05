import { banInputSchema, setAccountBan } from '../../../../admin/community/users';

export default defineEventHandler(async (event) => {
  const actor = await requireAdminAccess(event, 'users');
  const { isBanned } = parseInput(banInputSchema, await readBody(event));
  const id = requiredIdParam(event);
  return audited({ actor, table: schema.users, id }, () => setAccountBan(actor, id, isBanned));
});
