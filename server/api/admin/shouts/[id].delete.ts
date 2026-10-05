import { removeShout } from '../../../admin/community/shouts';

export default defineEventHandler(async (event) => {
  const actor = await requireAdminAccess(event, 'shoutbox');
  const id = requiredIdParam(event);
  return audited({ actor, table: schema.shouts, id }, () => removeShout(id));
});
