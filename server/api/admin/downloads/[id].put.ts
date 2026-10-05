import { downloadsResource } from '../../../admin/directory/downloads';

export default defineEventHandler(async (event) => {
  const actor = await requireAdminAccess(event, downloadsResource.access);
  const id = requiredIdParam(event);
  const locale = contentLocaleOf(event);
  foundOr404(downloadsResource.find(id));
  await audited({ actor, table: schema.downloads, id, locale }, async () =>
    downloadsResource.update(id, await readBody(event), actor, locale),
  );
  return { id };
});
