import { parseLegacyUrl } from '#shared/utils/legacyUrls';

const PERMANENT_REDIRECT = 301;

export default defineEventHandler((event) => {
  const { pathname, search } = getRequestURL(event);
  if (!looksLikeLegacyRequest(pathname)) {
    return;
  }
  const target = parseLegacyUrl(`${pathname}${search}`);
  if (target) {
    return sendRedirect(event, resolveLegacyTarget(target), PERMANENT_REDIRECT);
  }
});
