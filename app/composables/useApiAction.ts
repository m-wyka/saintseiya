export const useApiAction = () => {
  const isBusy = ref(false);
  const errorMessage = ref('');

  const run = async (action: () => Promise<unknown>): Promise<boolean> => {
    isBusy.value = true;
    errorMessage.value = '';
    try {
      await action();
      return true;
    } catch (error) {
      errorMessage.value = apiErrorMessage(error);
      return false;
    } finally {
      isBusy.value = false;
    }
  };

  return { isBusy, errorMessage, run };
};
