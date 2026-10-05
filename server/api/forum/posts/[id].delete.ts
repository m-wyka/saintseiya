export default defineEventHandler(async (event) => {
  const actor = await requirePermission(event, 'forum');
  const id = requiredIdParam(event);
  return audited({ actor, table: schema.posts, id }, () => deletePost(id));
});
