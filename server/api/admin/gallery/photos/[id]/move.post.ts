import { movePhoto } from '../../../../../admin/content/photos';

export default defineEventHandler(async (event) => {
  const actor = await requireAdminAccess(event, 'gallery');
  const id = requiredIdParam(event);
  const { direction } = parseInput(moveInputSchema, await readBody(event));
  await audited({ actor, table: schema.photos, id }, () => movePhoto(id, direction));
  return { id };
});
