<script setup lang="ts">
import type { CommentTarget } from '#shared/utils/content';

definePageMeta({ layout: 'admin' });

interface CommentRow {
  id: number;
  targetKind: CommentTarget;
  excerpt: string;
  isHidden: boolean;
  createdAt: string;
  author: { name: string; isGhost: boolean };
  target: { title: string; url: string } | null;
}

const TARGET_KIND_LABELS: Record<CommentTarget, string> = {
  news: 'News',
  page: 'Podstrona',
  photo: 'Zdjęcie',
  video: 'Film',
};
const COLUMNS = [
  { key: 'author', label: 'Autor' },
  { key: 'target', label: 'Dotyczy' },
  { key: 'excerpt', label: 'Treść' },
  { key: 'createdAt', label: 'Data' },
  { key: 'isHidden', label: 'Widoczność' },
];

const { rows, page, pageCount, total, search, filter, isLoading, refresh, remove } =
  useAdminList<CommentRow>('comments');
const moderate = useModerationAction();

const setHidden = async (comment: CommentRow, isHidden: boolean) => {
  const wasChanged = await moderate(
    () => apiRequest(`/api/admin/comments/${comment.id}/visibility`, { method: 'PATCH', body: { isHidden } }),
    isHidden ? 'Komentarz ukryty' : 'Komentarz znów widoczny',
  );
  if (wasChanged) {
    await refresh();
  }
};

useSeoMeta({ title: 'Komentarze' });
</script>

<template>
  <div>
    <AdminHeader title="Komentarze" :subtitle="pluralize(total, 'komentarz', 'komentarze', 'komentarzy')">
      <BaseInput v-model="search" type="search" label="Szukaj" placeholder="Szukaj w treści…" hide-label class="w-56" />
      <BaseSelect v-model="filter" label="Widoczność" :options="VISIBILITY_FILTERS" hide-label class="w-40" />
    </AdminHeader>

    <AdminTable
      :columns="COLUMNS"
      :rows="rows"
      :is-loading="isLoading"
      empty-message="Brak komentarzy do wyświetlenia."
    >
      <template #cell-author="{ row }">
        <AuthorName :author="row.author" />
      </template>
      <template #cell-target="{ row }">
        <span class="block text-[0.7rem] tracking-wide text-aqua-500 uppercase">
          {{ TARGET_KIND_LABELS[row.targetKind] }}
        </span>
        <NuxtLink v-if="row.target" :to="row.target.url" class="font-semibold text-gold-300 hover:text-cosmo-400">
          {{ row.target.title }}
        </NuxtLink>
        <span v-else class="text-aqua-500">Treść niedostępna publicznie</span>
      </template>
      <template #cell-excerpt="{ row }">
        <span class="line-clamp-3 max-w-md">{{ row.excerpt }}</span>
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
