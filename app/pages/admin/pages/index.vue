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

const { t } = useI18n();

const columns = computed(() => [
  { key: 'title', label: t('GENERAL.TITLE') },
  { key: 'kind', label: t('ADMIN_PAGES.KIND_COLUMN') },
  { key: 'status', label: t('GENERAL.STATUS') },
  { key: 'childCount', label: t('ADMIN_PAGES.SUBPAGES_COLUMN'), alignsRight: true },
]);

const route = useRoute();
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
const subtitle = computed(() => {
  const count = formatNumber(total.value);
  return isSearchMode.value
    ? t('ADMIN_PAGES.FOUND', { pages: t('ADMIN_PAGES.PAGE_COUNT', { count }, total.value) })
    : t('ADMIN_PAGES.SUBPAGE_COUNT', { count }, total.value);
});
const emptyMessage = computed(() => {
  if (isSearchMode.value) {
    return t('ADMIN_PAGES.NO_MATCHES');
  }
  return levelError.value ? t('ADMIN_PAGES.PAGE_NOT_FOUND') : t('ADMIN_PAGES.EMPTY_LEVEL');
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

useSeoMeta({ title: () => t('ADMIN_NAV.PAGES') });
</script>

<template>
  <div>
    <AdminHeader :title="t('ADMIN_NAV.PAGES')" :subtitle="subtitle">
      <BaseInput
        v-model="search"
        type="search"
        :label="t('ADMIN_PAGES.SEARCH_ALL')"
        :placeholder="t('ADMIN_PAGES.SEARCH_PLACEHOLDER')"
        hide-label
        class="w-56"
      />
      <BaseButton :to="newPagePath">
        <AppIcon name="plus" />
        {{ t('ADMIN_PAGES.ADD_PAGE') }}
      </BaseButton>
    </AdminHeader>

    <nav v-if="!isSearchMode" class="mb-4 text-sm text-aqua-300" :aria-label="t('ADMIN_PAGES.TREE_LEVEL')">
      <ol class="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        <li>
          <NuxtLinkLocale :to="ADMIN_PAGES_PATH" class="flex items-center gap-1.5 transition hover:text-gold-300">
            <AppIcon name="home" />
            {{ t('ADMIN_PAGES.ROOT_LEVEL') }}
          </NuxtLinkLocale>
        </li>
        <li v-for="crumb in level?.breadcrumbs" :key="crumb.id" class="flex items-center gap-1.5">
          <AppIcon name="chevronRight" class="text-cosmo-700" />
          <span v-if="crumb.id === parentId" class="font-semibold text-gold-300" aria-current="location">{{
            crumb.title
          }}</span>
          <NuxtLinkLocale v-else :to="adminPageLevelPath(crumb.id)" class="transition hover:text-gold-300">{{
            crumb.title
          }}</NuxtLinkLocale>
        </li>
      </ol>
    </nav>

    <AdminTable :columns="columns" :rows="rows" :is-loading="isLoading" :empty-message="emptyMessage">
      <template #cell-title="{ row }">
        <NuxtLinkLocale
          :to="`${ADMIN_PAGES_PATH}/${row.id}`"
          class="font-semibold text-gold-300 hover:text-cosmo-400"
          >{{ row.title }}</NuxtLinkLocale
        >
        <span v-if="isSearchMode" class="block text-xs break-all text-aqua-500">/{{ row.path }}</span>
      </template>
      <template #cell-kind="{ row }">{{ t(PAGE_KIND_LABEL_KEYS[row.kind]) }}</template>
      <template #cell-status="{ row }">
        <StatusBadge :status="row.status" />
      </template>
      <template #actions="{ row }">
        <BaseButton :to="adminPageLevelPath(row.id)" variant="ghost" size="sm">
          <AppIcon name="folder" />
          {{ t('ADMIN_PAGES.SUBPAGES') }}
        </BaseButton>
        <BaseButton v-if="row.status === 'published'" :to="routes.page(row.path)" variant="ghost" size="sm">
          <AppIcon name="eye" />
          {{ t('ADMIN_PAGES.VIEW') }}
        </BaseButton>
        <BaseButton :to="`${ADMIN_PAGES_PATH}/${row.id}`" variant="ghost" size="sm">
          <AppIcon name="edit" />
          {{ t('GENERAL.EDIT') }}
        </BaseButton>
        <template v-if="!isSearchMode">
          <BaseButton
            variant="ghost"
            size="sm"
            :disabled="isFirstSibling(row)"
            :aria-label="t('ADMIN_PAGES.MOVE_UP_LABEL', { title: row.title })"
            :title="t('ADMIN_PAGES.MOVE_UP')"
            @click="move(row, 'previous')"
          >
            <AppIcon name="chevronDown" class="rotate-180" />
          </BaseButton>
          <BaseButton
            variant="ghost"
            size="sm"
            :disabled="isLastSibling(row)"
            :aria-label="t('ADMIN_PAGES.MOVE_DOWN_LABEL', { title: row.title })"
            :title="t('ADMIN_PAGES.MOVE_DOWN')"
            @click="move(row, 'next')"
          >
            <AppIcon name="chevronDown" />
          </BaseButton>
        </template>
        <ConfirmButton :question="t('CONFIRM.DELETE_PAGE')" @confirm="removePage(row)" />
      </template>
    </AdminTable>
    <PageStepper v-if="isSearchMode" v-model="page" :page-count="pageCount" />
  </div>
</template>
