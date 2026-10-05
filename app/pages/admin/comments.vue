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

const TARGET_KIND_LABEL_KEYS: Record<CommentTarget, string> = {
  news: 'ADMIN_COMMENTS.TARGET_NEWS',
  page: 'ADMIN_COMMENTS.TARGET_PAGE',
  photo: 'ADMIN_COMMENTS.TARGET_PHOTO',
  video: 'ADMIN_COMMENTS.TARGET_VIDEO',
};

const { t } = useI18n();

const columns = computed(() => [
  { key: 'author', label: t('GENERAL.AUTHOR') },
  { key: 'target', label: t('ADMIN_COMMENTS.TARGET') },
  { key: 'excerpt', label: t('GENERAL.CONTENT') },
  { key: 'createdAt', label: t('GENERAL.DATE') },
  { key: 'isHidden', label: t('ADMIN_COMMENTS.VISIBILITY') },
]);
const visibilityOptions = computed(() =>
  VISIBILITY_FILTERS.map(({ value, labelKey }) => ({ value, label: t(labelKey) })),
);

const { rows, page, pageCount, total, search, filter, isLoading, refresh, remove } =
  useAdminList<CommentRow>('comments');
const moderate = useModerationAction();

const setHidden = async (comment: CommentRow, isHidden: boolean) => {
  const wasChanged = await moderate(
    () => apiRequest(`/api/admin/comments/${comment.id}/visibility`, { method: 'PATCH', body: { isHidden } }),
    isHidden ? t('ADMIN_COMMENTS.HIDDEN_TOAST') : t('ADMIN_COMMENTS.VISIBLE_TOAST'),
  );
  if (wasChanged) {
    await refresh();
  }
};

useSeoMeta({ title: () => t('ADMIN_NAV.COMMENTS') });
</script>

<template>
  <div>
    <AdminHeader
      :title="t('ADMIN_NAV.COMMENTS')"
      :subtitle="t('ADMIN_COMMENTS.COMMENT_COUNT', { count: formatNumber(total) }, total)"
    >
      <BaseInput
        v-model="search"
        type="search"
        :label="t('GENERAL.SEARCH')"
        :placeholder="t('ADMIN_COMMENTS.SEARCH_PLACEHOLDER')"
        hide-label
        class="w-56"
      />
      <BaseSelect
        v-model="filter"
        :label="t('ADMIN_COMMENTS.VISIBILITY')"
        :options="visibilityOptions"
        hide-label
        class="w-40"
      />
    </AdminHeader>

    <AdminTable :columns="columns" :rows="rows" :is-loading="isLoading" :empty-message="t('ADMIN_COMMENTS.EMPTY')">
      <template #cell-author="{ row }">
        <AuthorName :author="row.author" />
      </template>
      <template #cell-target="{ row }">
        <span class="block text-[0.7rem] tracking-wide text-aqua-500 uppercase">
          {{ t(TARGET_KIND_LABEL_KEYS[row.targetKind]) }}
        </span>
        <NuxtLinkLocale v-if="row.target" :to="row.target.url" class="font-semibold text-gold-300 hover:text-cosmo-400">
          {{ row.target.title }}
        </NuxtLinkLocale>
        <span v-else class="text-aqua-500">{{ t('ADMIN_COMMENTS.TARGET_UNAVAILABLE') }}</span>
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
          {{ row.isHidden ? t('ADMIN_COMMENTS.SHOW') : t('ADMIN_COMMENTS.HIDE') }}
        </BaseButton>
        <ConfirmButton @confirm="remove(row.id)" />
      </template>
    </AdminTable>
    <PageStepper v-model="page" :page-count="pageCount" />
  </div>
</template>
