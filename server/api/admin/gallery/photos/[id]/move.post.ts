import { movePhoto } from '../../../../../admin/content/photos';

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event, 'gallery');
  const id = requiredIdParam(event);
  const { direction } = parseInput(moveInputSchema, await readBody(event));
  movePhoto(id, direction);
  return { id };
});
