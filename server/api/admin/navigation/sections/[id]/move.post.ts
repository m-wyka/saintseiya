import { moveNavigationSection, navigationSectionsResource } from '../../../../../admin/directory/navigationSections';

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event, navigationSectionsResource.access);
  const id = requiredIdParam(event);
  foundOr404(navigationSectionsResource.find(id));
  const { direction } = await readValidatedBody(event, moveInputSchema.parse);
  moveNavigationSection(id, direction);
  return { id };
});
