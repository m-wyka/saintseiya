import { DEFAULT_LOCALE, withLocalePrefix } from '#shared/utils/locales';
import { englishPagePath, routes } from '#shared/utils/routes';

export default defineEventHandler(async (event) => {
  const location = foundOr404(postLocation(requiredIdParam(event), await viewerOf(event)), 'ERRORS.POST_NOT_FOUND');
  const locale = contentLocaleOf(event);
  const polishPath = routes.thread(location.threadId);
  const threadPath = locale === DEFAULT_LOCALE ? polishPath : withLocalePrefix(englishPagePath(polishPath), locale);
  const pageQuery = location.page > 1 ? `?page=${location.page}` : '';
  return sendRedirect(event, `${threadPath}${pageQuery}#post-${location.postId}`, 301);
});
