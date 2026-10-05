import { setShoutHidden } from '../../../../admin/community/shouts';
import { visibilityInputSchema } from '../../../../admin/community/visibility';

export default defineEventHandler(async (event) => {
  const actor = await requireAdminAccess(event, 'shoutbox');
  const { isHidden } = parseInput(visibilityInputSchema, await readBody(event));
  const id = requiredIdParam(event);
  return audited({ actor, table: schema.shouts, id }, () => setShoutHidden(id, isHidden));
});
