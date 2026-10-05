export const useModerationAction = () => {
  const toasts = useToastStore();

  return async (request: () => Promise<unknown>, successMessage: string): Promise<boolean> => {
    try {
      await request();
      toasts.success(successMessage);
      return true;
    } catch (error) {
      toasts.error(apiErrorMessage(error));
      return false;
    }
  };
};
