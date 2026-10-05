import type { Ref } from 'vue';

interface PaginatedRows<Row> {
  items: Row[];
  page: number;
  pageCount: number;
  total: number;
}

const SEARCH_DEBOUNCE_MS = 250;

const debounced = (source: Ref<string>): Ref<string> => {
  const settled = ref(source.value);
  let timer: ReturnType<typeof setTimeout> | undefined;
  watch(source, (value) => {
    clearTimeout(timer);
    timer = setTimeout(() => (settled.value = value), SEARCH_DEBOUNCE_MS);
  });
  return settled;
};

export const useAdminList = <Row extends { id: number }>(resource: string) => {
  const page = ref(1);
  const search = ref('');
  const filter = ref('');
  const settledSearch = debounced(search);
  const toasts = useToastStore();
  const { t } = useI18n();

  watch([settledSearch, filter], () => (page.value = 1));

  const { data, refresh, status } = useFetch<PaginatedRows<Row> | Row[]>(`/api/admin/${resource}`, {
    query: { page, search: settledSearch, filter },
  });

  const rows = computed<Row[]>(() => (Array.isArray(data.value) ? data.value : (data.value?.items ?? [])));
  const pageCount = computed(() => (Array.isArray(data.value) ? 1 : (data.value?.pageCount ?? 1)));
  watch(pageCount, (lastPage) => (page.value = Math.min(page.value, lastPage)));

  const total = computed(() => (Array.isArray(data.value) ? data.value.length : (data.value?.total ?? 0)));

  const remove = async (id: number) => {
    try {
      await apiRequest(`/api/admin/${resource}/${id}`, { method: 'DELETE' });
      toasts.success(t('GENERAL.DELETED'));
      await refresh();
    } catch (error) {
      toasts.error(apiErrorMessage(error));
    }
  };

  return {
    rows,
    page,
    pageCount,
    total,
    search,
    filter,
    isLoading: computed(() => status.value === 'pending'),
    refresh,
    remove,
  };
};
