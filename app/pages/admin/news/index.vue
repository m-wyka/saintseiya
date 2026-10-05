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

const STATUS_FILTERS = [
  { value: '', label: 'Wszystkie' },
  { value: 'published', label: 'Opublikowane' },
  { value: 'draft', label: 'Szkice' },
];
const COLUMNS = [
  { key: 'title', label: 'Tytuł' },
  { key: 'categoryName', label: 'Kategoria' },
  { key: 'authorName', label: 'Autor' },
  { key: 'status', label: 'Status' },
  { key: 'publishedAt', label: 'Data' },
];

const { rows, page, pageCount, total, search, filter, isLoading, remove } = useAdminList<NewsRow>('news');

useSeoMeta({ title: 'Newsy' });
</script>

<template>
  <div>
    <AdminHeader title="Newsy" :subtitle="pluralize(total, 'news', 'newsy', 'newsów')">
      <BaseInput
        v-model="search"
        type="search"
        label="Szukaj"
        placeholder="Szukaj po tytule…"
        hide-label
        class="w-56"
      />
      <BaseSelect v-model="filter" label="Status" :options="STATUS_FILTERS" hide-label class="w-40" />
      <BaseButton to="/admin/newsy/nowy">
        <AppIcon name="plus" />
        Dodaj news
      </BaseButton>
    </AdminHeader>

    <AdminTable :columns="COLUMNS" :rows="rows" :is-loading="isLoading">
      <template #cell-title="{ row }">
        <NuxtLink :to="`/admin/newsy/${row.id}`" class="font-semibold text-gold-300 hover:text-cosmo-400">{{
          row.title
        }}</NuxtLink>
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
          Zobacz
        </BaseButton>
        <BaseButton :to="`/admin/newsy/${row.id}`" variant="ghost" size="sm">
          <AppIcon name="edit" />
          Edytuj
        </BaseButton>
        <ConfirmButton @confirm="remove(row.id)" />
      </template>
    </AdminTable>
    <PageStepper v-model="page" :page-count="pageCount" />
  </div>
</template>
