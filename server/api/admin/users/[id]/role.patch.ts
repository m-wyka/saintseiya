import { changeAccountRole, roleInputSchema } from '../../../../admin/community/users';

export default defineEventHandler(async (event) => {
  const actor = await requireAdmin(event);
  return changeAccountRole(actor, requiredIdParam(event), parseInput(roleInputSchema, await readBody(event)));
});
