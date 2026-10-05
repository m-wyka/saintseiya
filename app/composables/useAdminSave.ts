export const useAdminSave = (resource: string) => {
  const { isBusy, errorMessage, run } = useApiAction();
  const toasts = useToastStore();
  const { t } = useI18n();

  const save = async (id: number | null, input: Record<string, unknown>): Promise<boolean> => {
    const wasSaved = await run(() =>
      id === null
        ? apiRequest(`/api/admin/${resource}`, { method: 'POST', body: input })
        : apiRequest(`/api/admin/${resource}/${id}`, { method: 'PUT', body: input }),
    );
    if (wasSaved) {
      toasts.success(t('GENERAL.SAVED'));
    }
    return wasSaved;
  };

  return { isBusy, errorMessage, save };
};
