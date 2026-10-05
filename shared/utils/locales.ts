export const CONTENT_LOCALES = ['pl', 'en'] as const;
export type ContentLocale = (typeof CONTENT_LOCALES)[number];

export const DEFAULT_LOCALE: ContentLocale = 'pl';
export const CONTENT_LOCALE_HEADER = 'x-content-locale';

export const isContentLocale = (value: unknown): value is ContentLocale =>
  (CONTENT_LOCALES as readonly unknown[]).includes(value);

export const localeOfPath = (path: string): ContentLocale => {
  const [, firstSegment] = path.split(/[/?#]/);
  return isContentLocale(firstSegment) ? firstSegment : DEFAULT_LOCALE;
};

export const withLocalePrefix = (path: string, locale: string): string =>
  locale === DEFAULT_LOCALE ? path : `/${locale}${path}`;
