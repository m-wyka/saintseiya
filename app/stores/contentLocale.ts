import type { ContentLocale } from '#shared/utils/locales';
import { DEFAULT_LOCALE } from '#shared/utils/locales';

export const useContentLocaleStore = defineStore('contentLocale', () => {
  const editedLocale = ref<ContentLocale>(DEFAULT_LOCALE);
  const isTranslating = computed(() => editedLocale.value !== DEFAULT_LOCALE);

  // Switching the language reloads every form of the panel, so a form reports here while it holds unsaved input.
  const formsWithUnsavedChanges = ref(new Set<symbol>());
  const hasUnsavedChanges = computed(() => formsWithUnsavedChanges.value.size > 0);
  const reportUnsavedChanges = (form: symbol, hasChanges: boolean) => {
    if (hasChanges) {
      formsWithUnsavedChanges.value.add(form);
    } else {
      formsWithUnsavedChanges.value.delete(form);
    }
  };

  return { editedLocale, isTranslating, hasUnsavedChanges, reportUnsavedChanges };
});
