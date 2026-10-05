import { CONTENT_LOCALE_HEADER, isContentLocale, localeOfPath } from '#shared/utils/locales';

export default defineEventHandler((event) => {
  const requested = getRequestHeader(event, CONTENT_LOCALE_HEADER);
  const locale = isContentLocale(requested) ? requested : localeOfPath(event.path);
  event.context.contentLocale = locale;
  // Requests made while rendering a page forward its headers, so the page's language reaches the API.
  event.node.req.headers[CONTENT_LOCALE_HEADER] = locale;
});
