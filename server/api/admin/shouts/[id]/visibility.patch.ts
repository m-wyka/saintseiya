import { setShoutHidden } from '../../../../admin/community/shouts';
import { visibilityInputSchema } from '../../../../admin/community/visibility';

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event, 'shoutbox');
  const { isHidden } = parseInput(visibilityInputSchema, await readBody(event));
  return setShoutHidden(requiredIdParam(event), isHidden);
});
