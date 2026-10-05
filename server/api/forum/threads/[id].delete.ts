export default defineEventHandler(async (event) => {
  await requirePermission(event, 'forum');
  return deleteThread(requiredIdParam(event));
});
