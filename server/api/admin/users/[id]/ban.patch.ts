import { banInputSchema, setAccountBan } from '../../../../admin/community/users';

export default defineEventHandler(async (event) => {
  const actor = await requireAdminAccess(event, 'users');
  const { isBanned } = parseInput(banInputSchema, await readBody(event));
  return setAccountBan(actor, requiredIdParam(event), isBanned);
});
