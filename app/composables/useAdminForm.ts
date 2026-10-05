const NEW_RECORD_PARAM = 'nowy';

interface AdminFormOptions<Input extends Record<string, unknown>> {
  resource: string;
  recordId: string;
  emptyInput: Input;
  listPath: string | ((savedInput: Input) => string);
}

export const useAdminForm = async <Input extends Record<string, unknown>>(options: AdminFormOptions<Input>) => {
  const isNew = options.recordId === NEW_RECORD_PARAM;
  const input = ref({ ...options.emptyInput }) as Ref<Input>;
  const toasts = useToastStore();
  const { t } = useI18n();
  const localePath = useLocalePath();
  const { isBusy, errorMessage, run } = useApiAction();

  if (!isNew) {
    const stored = await $fetch<Record<string, unknown>>(`/api/admin/${options.resource}/${options.recordId}`).catch(
      () => null,
    );
    if (!stored) {
      throw createError({ statusCode: 404, statusMessage: t('ADMIN_UI.NOT_FOUND'), fatal: true });
    }
    const knownKeys = Object.keys(options.emptyInput) as (keyof Input)[];
    input.value = Object.fromEntries(
      knownKeys.map((key) => [key, stored[key as string] ?? options.emptyInput[key]]),
    ) as Input;
  }

  const save = async () => {
    const wasSaved = await run(() =>
      isNew
        ? apiRequest(`/api/admin/${options.resource}`, { method: 'POST', body: input.value })
        : apiRequest(`/api/admin/${options.resource}/${options.recordId}`, { method: 'PUT', body: input.value }),
    );
    if (wasSaved) {
      toasts.success(t('GENERAL.SAVED'));
      const listPath = typeof options.listPath === 'function' ? options.listPath(input.value) : options.listPath;
      await navigateTo(localePath(listPath));
    }
  };

  return { input, isNew, isBusy, errorMessage, save };
};
