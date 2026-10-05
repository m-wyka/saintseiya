import {
  findNavigationLink,
  moveNavigationLink,
  navigationLinksResource,
} from '../../../../../admin/directory/navigationLinks';

export default defineEventHandler(async (event) => {
  const actor = await requireAdminAccess(event, navigationLinksResource.access);
  const link = foundOr404(findNavigationLink(requiredIdParam(event)));
  const { direction } = await readValidatedBody(event, moveInputSchema.parse);
  await audited({ actor, table: schema.navigationLinks, id: link.id }, () => moveNavigationLink(link, direction));
  return { id: link.id };
});
