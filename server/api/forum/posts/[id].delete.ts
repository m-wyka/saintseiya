export default defineEventHandler(async (event) => {
  await requirePermission(event, 'forum');
  return deletePost(requiredIdParam(event));
});
