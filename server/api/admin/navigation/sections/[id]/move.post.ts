import { moveNavigationSection, navigationSectionsResource } from '../../../../../admin/directory/navigationSections';

export default defineEventHandler(async (event) => {
  const actor = await requireAdminAccess(event, navigationSectionsResource.access);
  const id = requiredIdParam(event);
  foundOr404(navigationSectionsResource.find(id));
  const { direction } = await readValidatedBody(event, moveInputSchema.parse);
  await audited({ actor, table: schema.navigationSections, id }, () => moveNavigationSection(id, direction));
  return { id };
});
