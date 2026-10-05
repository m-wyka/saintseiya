import type { H3Event } from 'h3';
import type { ContentLocale } from '#shared/utils/locales';
import { DEFAULT_LOCALE, isContentLocale } from '#shared/utils/locales';

export const contentLocaleOf = (event: H3Event): ContentLocale => {
  const locale: unknown = event.context.contentLocale;
  return isContentLocale(locale) ? locale : DEFAULT_LOCALE;
};
