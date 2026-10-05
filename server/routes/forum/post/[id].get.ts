import { routes } from '#shared/utils/routes';

export default defineEventHandler(async (event) => {
  const location = foundOr404(postLocation(requiredIdParam(event), await viewerOf(event)), 'ERRORS.POST_NOT_FOUND');
  const pageQuery = location.page > 1 ? `?page=${location.page}` : '';
  return sendRedirect(event, `${routes.thread(location.threadId)}${pageQuery}#post-${location.postId}`, 301);
});
