import { CONTENT_LOCALE_HEADER } from '#shared/utils/locales';

const API_PREFIX = '/api/';
const ADMIN_API_PREFIX = '/api/admin/';

const pathOf = (input: RequestInfo | URL): string => {
  const address = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  return new URL(address, window.location.origin).pathname;
};

export default defineNuxtPlugin((nuxtApp) => {
  const contentLocale = useContentLocaleStore();
  const siteLocale = () => (nuxtApp.$i18n as { locale: Ref<string> }).locale.value;
  const browserFetch = window.fetch.bind(window);

  window.fetch = (input, init) => {
    const path = pathOf(input);
    if (!path.startsWith(API_PREFIX)) {
      return browserFetch(input, init);
    }
    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    headers.set(CONTENT_LOCALE_HEADER, path.startsWith(ADMIN_API_PREFIX) ? contentLocale.editedLocale : siteLocale());
    return browserFetch(input, { ...init, headers });
  };

  nuxtApp.hook('i18n:localeSwitched', () => refreshNuxtData());
});
