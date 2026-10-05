export default defineEventHandler(async (event) => {
  const threadId = requiredIdParam(event);
  const page = await pageQuery(event);
  const result = foundOr404(
    threadPosts(threadId, page, await viewerOf(event), contentLocaleOf(event)),
    'ERRORS.THREAD_NOT_FOUND',
  );
  countThreadView(threadId);
  return result;
});
