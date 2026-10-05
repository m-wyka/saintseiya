<script setup lang="ts">
import type { ContentStatus } from '#shared/utils/content';
import { routes } from '#shared/utils/routes';

definePageMeta({ layout: 'admin' });

interface NewsRow {
  id: number;
  title: string;
  slug: string;
  status: ContentStatus;
  publishedAt: string | null;
  categoryName: string | null;
  authorName: string;
}

const { t } = useI18n();

const statusFilters = computed(() => [
  { value: '', label: t('GENERAL.ALL') },
  { value: 'published', label: t('ADMIN_NEWS.FILTER_PUBLISHED') },
  { value: 'draft', label: t('ADMIN_NEWS.FILTER_DRAFTS') },
]);
const columns = computed(() => [
  { key: 'title', label: t('GENERAL.TITLE') },
  { key: 'categoryName', label: t('GENERAL.CATEGORY') },
  { key: 'authorName', label: t('GENERAL.AUTHOR') },
  { key: 'status', label: t('GENERAL.STATUS') },
  { key: 'publishedAt', label: t('GENERAL.DATE') },
]);

const { rows, page, pageCount, total, search, filter, isLoading, remove } = useAdminList<NewsRow>('news');

useSeoMeta({ title: () => t('ADMIN_NAV.NEWS') });
</script>

<template>
  <div>
    <AdminHeader
      :title="t('ADMIN_NAV.NEWS')"
      :subtitle="t('ADMIN_NEWS.NEWS_COUNT', { count: formatNumber(total) }, total)"
    >
      <BaseInput
        v-model="search"
        type="search"
        :label="t('GENERAL.SEARCH')"
        :placeholder="t('ADMIN_NEWS.SEARCH_PLACEHOLDER')"
        hide-label
        class="w-56"
      />
      <BaseSelect v-model="filter" :label="t('GENERAL.STATUS')" :options="statusFilters" hide-label class="w-40" />
      <BaseButton to="/admin/newsy/nowy">
        <AppIcon name="plus" />
        {{ t('ADMIN_NEWS.ADD_NEWS') }}
      </BaseButton>
    </AdminHeader>

    <AdminTable :columns="columns" :rows="rows" :is-loading="isLoading">
      <template #cell-title="{ row }">
        <NuxtLinkLocale :to="`/admin/newsy/${row.id}`" class="font-semibold text-gold-300 hover:text-cosmo-400">{{
          row.title
        }}</NuxtLinkLocale>
      </template>
      <template #cell-status="{ row }">
        <StatusBadge :status="row.status" />
      </template>
      <template #cell-publishedAt="{ row }">
        {{ row.publishedAt ? formatLongDate(row.publishedAt) : '—' }}
      </template>
      <template #actions="{ row }">
        <BaseButton v-if="row.status === 'published'" :to="routes.news(row.slug)" variant="ghost" size="sm">
          <AppIcon name="eye" />
          {{ t('ADMIN_NEWS.VIEW') }}
        </BaseButton>
        <BaseButton :to="`/admin/newsy/${row.id}`" variant="ghost" size="sm">
          <AppIcon name="edit" />
          {{ t('GENERAL.EDIT') }}
        </BaseButton>
        <ConfirmButton :question="t('CONFIRM.DELETE_NEWS')" @confirm="remove(row.id)" />
      </template>
    </AdminTable>
    <PageStepper v-model="page" :page-count="pageCount" />
  </div>
</template>
