<script setup lang="ts">
definePageMeta({ layout: 'admin' });

interface ShoutRow {
  id: number;
  bodyHtml: string;
  isHidden: boolean;
  createdAt: string;
  author: { name: string; isGhost: boolean };
}

const { t } = useI18n();

const columns = computed(() => [
  { key: 'author', label: t('GENERAL.AUTHOR') },
  { key: 'bodyHtml', label: t('ADMIN_SHOUTBOX.MESSAGE') },
  { key: 'createdAt', label: t('GENERAL.DATE') },
  { key: 'isHidden', label: t('ADMIN_SHOUTBOX.VISIBILITY') },
]);
const visibilityOptions = computed(() =>
  VISIBILITY_FILTERS.map(({ value, labelKey }) => ({ value, label: t(labelKey) })),
);

const { rows, page, pageCount, total, search, filter, isLoading, refresh, remove } = useAdminList<ShoutRow>('shouts');
const moderate = useModerationAction();

const setHidden = async (shout: ShoutRow, isHidden: boolean) => {
  const wasChanged = await moderate(
    () => apiRequest(`/api/admin/shouts/${shout.id}/visibility`, { method: 'PATCH', body: { isHidden } }),
    isHidden ? t('ADMIN_SHOUTBOX.HIDDEN_TOAST') : t('ADMIN_SHOUTBOX.VISIBLE_TOAST'),
  );
  if (wasChanged) {
    await refresh();
  }
};

useSeoMeta({ title: () => t('ADMIN_NAV.SHOUTBOX') });
</script>

<template>
  <div>
    <AdminHeader
      :title="t('ADMIN_NAV.SHOUTBOX')"
      :subtitle="t('ADMIN_SHOUTBOX.SHOUT_COUNT', { count: formatNumber(total) }, total)"
    >
      <BaseInput
        v-model="search"
        type="search"
        :label="t('GENERAL.SEARCH')"
        :placeholder="t('ADMIN_SHOUTBOX.SEARCH_PLACEHOLDER')"
        hide-label
        class="w-56"
      />
      <BaseSelect
        v-model="filter"
        :label="t('ADMIN_SHOUTBOX.VISIBILITY')"
        :options="visibilityOptions"
        hide-label
        class="w-40"
      />
    </AdminHeader>

    <AdminTable :columns="columns" :rows="rows" :is-loading="isLoading" :empty-message="t('ADMIN_SHOUTBOX.EMPTY')">
      <template #cell-author="{ row }">
        <AuthorName :author="row.author" />
      </template>
      <template #cell-bodyHtml="{ row }">
        <RichContent :html="row.bodyHtml" class="max-w-xl text-sm" />
      </template>
      <template #cell-createdAt="{ row }">
        <time :datetime="row.createdAt" class="whitespace-nowrap">{{ formatDateTime(row.createdAt) }}</time>
      </template>
      <template #cell-isHidden="{ row }">
        <VisibilityBadge :is-hidden="row.isHidden" />
      </template>
      <template #actions="{ row }">
        <BaseButton variant="ghost" size="sm" @click="setHidden(row, !row.isHidden)">
          <AppIcon name="eye" />
          {{ row.isHidden ? t('ADMIN_SHOUTBOX.SHOW') : t('ADMIN_SHOUTBOX.HIDE') }}
        </BaseButton>
        <ConfirmButton :question="t('CONFIRM.DELETE_SHOUT')" @confirm="remove(row.id)" />
      </template>
    </AdminTable>
    <PageStepper v-model="page" :page-count="pageCount" />
  </div>
</template>
