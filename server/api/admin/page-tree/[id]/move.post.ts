import { movePage } from '../../../../admin/content/pages';

export default defineEventHandler(async (event) => {
  const actor = await requireAdminAccess(event, 'pages');
  const id = requiredIdParam(event);
  const { direction } = parseInput(moveInputSchema, await readBody(event));
  await audited({ actor, table: schema.pages, id }, () => movePage(id, direction));
  return { id };
});
