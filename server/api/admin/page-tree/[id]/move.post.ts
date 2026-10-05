import { movePage } from '../../../../admin/content/pages';

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event, 'pages');
  const id = requiredIdParam(event);
  const { direction } = parseInput(moveInputSchema, await readBody(event));
  movePage(id, direction);
  return { id };
});
