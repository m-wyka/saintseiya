export const useAdminSave = (resource: string) => {
  const { isBusy, errorMessage, run } = useApiAction();
  const toasts = useToastStore();
  const { t } = useI18n();
  const mayCreate = useCreationLocaleGuard();

  const save = async (id: number | null, input: Record<string, unknown>): Promise<boolean> => {
    if (!(await mayCreate(id === null))) {
      return false;
    }
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
