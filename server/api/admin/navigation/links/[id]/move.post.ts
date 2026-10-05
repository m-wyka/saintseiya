import {
  findNavigationLink,
  moveNavigationLink,
  navigationLinksResource,
} from '../../../../../admin/directory/navigationLinks';

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event, navigationLinksResource.access);
  const link = foundOr404(findNavigationLink(requiredIdParam(event)));
  const { direction } = await readValidatedBody(event, moveInputSchema.parse);
  moveNavigationLink(link, direction);
  return { id: link.id };
});
