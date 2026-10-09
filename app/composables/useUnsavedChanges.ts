export const useUnsavedChanges = (currentInput: () => unknown, isFormOpen: () => boolean = () => true) => {
  const contentLocale = useContentLocaleStore();
  const form = Symbol('form');
  const serialized = () => JSON.stringify(currentInput());
  const savedInput = ref(serialized());

  const markSaved = () => {
    savedInput.value = serialized();
  };

  watchEffect(() => contentLocale.reportUnsavedChanges(form, isFormOpen() && serialized() !== savedInput.value));
  onBeforeUnmount(() => contentLocale.reportUnsavedChanges(form, false));

  return { markSaved };
};
