<script setup lang="ts">
definePageMeta({ layout: 'admin' });

interface ShoutRow {
  id: number;
  bodyHtml: string;
  isHidden: boolean;
  createdAt: string;
  author: { name: string; isGhost: boolean };
}

const COLUMNS = [
  { key: 'author', label: 'Autor' },
  { key: 'bodyHtml', label: 'Wiadomość' },
  { key: 'createdAt', label: 'Data' },
  { key: 'isHidden', label: 'Widoczność' },
];

const { rows, page, pageCount, total, search, filter, isLoading, refresh, remove } = useAdminList<ShoutRow>('shouts');
const moderate = useModerationAction();

const setHidden = async (shout: ShoutRow, isHidden: boolean) => {
  const wasChanged = await moderate(
    () => apiRequest(`/api/admin/shouts/${shout.id}/visibility`, { method: 'PATCH', body: { isHidden } }),
    isHidden ? 'Wpis ukryty' : 'Wpis znów widoczny',
  );
  if (wasChanged) {
    await refresh();
  }
};

useSeoMeta({ title: 'Shoutbox' });
</script>

<template>
  <div>
    <AdminHeader title="Shoutbox" :subtitle="pluralize(total, 'wpis', 'wpisy', 'wpisów')">
      <BaseInput v-model="search" type="search" label="Szukaj" placeholder="Szukaj w treści…" hide-label class="w-56" />
      <BaseSelect v-model="filter" label="Widoczność" :options="VISIBILITY_FILTERS" hide-label class="w-40" />
    </AdminHeader>

    <AdminTable :columns="COLUMNS" :rows="rows" :is-loading="isLoading" empty-message="Brak wpisów do wyświetlenia.">
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
          {{ row.isHidden ? 'Pokaż' : 'Ukryj' }}
        </BaseButton>
        <ConfirmButton @confirm="remove(row.id)" />
      </template>
    </AdminTable>
    <PageStepper v-model="page" :page-count="pageCount" />
  </div>
</template>
