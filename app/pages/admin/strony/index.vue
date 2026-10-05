<script setup lang="ts">
import type { ContentStatus, PageKind } from '#shared/utils/content';
import { routes } from '#shared/utils/routes';

definePageMeta({ layout: 'admin' });

type MoveDirection = 'previous' | 'next';

interface PageRow {
  id: number;
  title: string;
  path: string;
  kind: PageKind;
  status: ContentStatus;
  childCount: number;
}

interface PageLevel {
  breadcrumbs: { id: number; title: string }[];
  children: PageRow[];
}

const COLUMNS = [
  { key: 'title', label: 'Tytuł' },
  { key: 'kind', label: 'Typ' },
  { key: 'status', label: 'Status' },
  { key: 'childCount', label: 'Podstron', alignsRight: true },
];

const route = useRoute('admin-strony');
const toasts = useToastStore();
const parentId = computed(() => Number(route.query.parent) || null);

const {
  rows: matches,
  page,
  pageCount,
  total,
  search,
  isLoading: isSearching,
  remove,
} = useAdminList<PageRow>('pages');
const {
  data: level,
  error: levelError,
  status: levelStatus,
  refresh: refreshLevel,
} = await useFetch<PageLevel>('/api/admin/page-tree/children', {
  query: { parent: computed(() => parentId.value ?? undefined) },
});

const isSearchMode = computed(() => search.value.trim() !== '');
const siblings = computed(() => level.value?.children ?? []);
const rows = computed(() => (isSearchMode.value ? matches.value : siblings.value));
const isLoading = computed(() => (isSearchMode.value ? isSearching.value : levelStatus.value === 'pending'));
const subtitle = computed(() =>
  isSearchMode.value
    ? `Znaleziono: ${pluralize(total.value, 'strona', 'strony', 'stron')}`
    : pluralize(total.value, 'podstrona', 'podstrony', 'podstron'),
);
const emptyMessage = computed(() => {
  if (isSearchMode.value) {
    return 'Żadna strona nie pasuje do tego tytułu.';
  }
  return levelError.value ? 'Nie znaleziono tej strony.' : 'Na tym poziomie nie ma jeszcze żadnych stron.';
});
const newPagePath = computed(
  () => `${ADMIN_PAGES_PATH}/nowy${parentId.value === null ? '' : `?parent=${parentId.value}`}`,
);

const isFirstSibling = (row: PageRow) => siblings.value[0]?.id === row.id;
const isLastSibling = (row: PageRow) => siblings.value.at(-1)?.id === row.id;

const move = async (row: PageRow, direction: MoveDirection) => {
  try {
    await apiRequest(`/api/admin/page-tree/${row.id}/move`, { method: 'POST', body: { direction } });
    await refreshLevel();
  } catch (error) {
    toasts.error(apiErrorMessage(error));
  }
};

const removePage = async (row: PageRow) => {
  await remove(row.id);
  await refreshLevel();
};

useSeoMeta({ title: 'Podstrony' });
</script>

<template>
  <div>
    <AdminHeader title="Podstrony" :subtitle="subtitle">
      <BaseInput
        v-model="search"
        type="search"
        label="Szukaj we wszystkich stronach"
        placeholder="Szukaj po tytule…"
        hide-label
        class="w-56"
      />
      <BaseButton :to="newPagePath">
        <AppIcon name="plus" />
        Dodaj stronę
      </BaseButton>
    </AdminHeader>

    <nav v-if="!isSearchMode" class="mb-4 text-sm text-aqua-300" aria-label="Poziom w drzewie stron">
      <ol class="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        <li>
          <NuxtLink :to="ADMIN_PAGES_PATH" class="flex items-center gap-1.5 transition hover:text-gold-300">
            <AppIcon name="home" />
            Poziom główny
          </NuxtLink>
        </li>
        <li v-for="crumb in level?.breadcrumbs" :key="crumb.id" class="flex items-center gap-1.5">
          <AppIcon name="chevronRight" class="text-cosmo-700" />
          <span v-if="crumb.id === parentId" class="font-semibold text-gold-300" aria-current="location">{{
            crumb.title
          }}</span>
          <NuxtLink v-else :to="adminPageLevelPath(crumb.id)" class="transition hover:text-gold-300">{{
            crumb.title
          }}</NuxtLink>
        </li>
      </ol>
    </nav>

    <AdminTable :columns="COLUMNS" :rows="rows" :is-loading="isLoading" :empty-message="emptyMessage">
      <template #cell-title="{ row }">
        <NuxtLink :to="`${ADMIN_PAGES_PATH}/${row.id}`" class="font-semibold text-gold-300 hover:text-cosmo-400">{{
          row.title
        }}</NuxtLink>
        <span v-if="isSearchMode" class="block text-xs break-all text-aqua-500">/{{ row.path }}</span>
      </template>
      <template #cell-kind="{ row }">{{ PAGE_KIND_LABELS[row.kind] }}</template>
      <template #cell-status="{ row }">
        <StatusBadge :status="row.status" />
      </template>
      <template #actions="{ row }">
        <BaseButton :to="adminPageLevelPath(row.id)" variant="ghost" size="sm">
          <AppIcon name="folder" />
          Podstrony
        </BaseButton>
        <BaseButton v-if="row.status === 'published'" :to="routes.page(row.path)" variant="ghost" size="sm">
          <AppIcon name="eye" />
          Zobacz
        </BaseButton>
        <BaseButton :to="`${ADMIN_PAGES_PATH}/${row.id}`" variant="ghost" size="sm">
          <AppIcon name="edit" />
          Edytuj
        </BaseButton>
        <template v-if="!isSearchMode">
          <BaseButton
            variant="ghost"
            size="sm"
            :disabled="isFirstSibling(row)"
            :aria-label="`Przesuń wyżej: ${row.title}`"
            title="Przesuń wyżej"
            @click="move(row, 'previous')"
          >
            <AppIcon name="chevronDown" class="rotate-180" />
          </BaseButton>
          <BaseButton
            variant="ghost"
            size="sm"
            :disabled="isLastSibling(row)"
            :aria-label="`Przesuń niżej: ${row.title}`"
            title="Przesuń niżej"
            @click="move(row, 'next')"
          >
            <AppIcon name="chevronDown" />
          </BaseButton>
        </template>
        <ConfirmButton @confirm="removePage(row)" />
      </template>
    </AdminTable>
    <PageStepper v-if="isSearchMode" v-model="page" :page-count="pageCount" />
  </div>
</template>
