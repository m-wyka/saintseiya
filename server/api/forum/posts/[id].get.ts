export default defineEventHandler(async (event) => {
  const { bodyHtml } = findEditablePost(requiredIdParam(event), await requireAccount(event));
  return { bodyHtml };
});
