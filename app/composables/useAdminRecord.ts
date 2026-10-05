export const useAdminRecord = () => {
  const toasts = useToastStore();

  return async <Stored>(resource: string, id: number): Promise<Stored | null> => {
    try {
      return await $fetch<Stored>(`/api/admin/${resource}/${id}`);
    } catch (error) {
      toasts.error(apiErrorMessage(error));
      return null;
    }
  };
};
