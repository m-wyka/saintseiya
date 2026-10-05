import { changeAccountRole, roleInputSchema } from '../../../../admin/community/users';

export default defineEventHandler(async (event) => {
  const actor = await requireAdmin(event);
  const input = parseInput(roleInputSchema, await readBody(event));
  const id = requiredIdParam(event);
  return audited({ actor, table: schema.users, id }, () => changeAccountRole(actor, id, input));
});
