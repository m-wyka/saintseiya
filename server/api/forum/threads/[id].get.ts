export default defineEventHandler(async (event) => {
  const threadId = requiredIdParam(event);
  const page = await pageQuery(event);
  const result = foundOr404(threadPosts(threadId, page, await viewerOf(event)), 'Nie znaleziono tematu');
  countThreadView(threadId);
  return result;
});
