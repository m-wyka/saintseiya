import type { ContentLocale } from '#shared/utils/locales';
import { DEFAULT_LOCALE } from '#shared/utils/locales';

export const useContentLocaleStore = defineStore('contentLocale', () => {
  const editedLocale = ref<ContentLocale>(DEFAULT_LOCALE);
  const isTranslating = computed(() => editedLocale.value !== DEFAULT_LOCALE);

  return { editedLocale, isTranslating };
});
