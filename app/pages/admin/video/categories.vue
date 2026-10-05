<script setup lang="ts">
import { routes } from '#shared/utils/routes';
import type { CrudColumn, CrudField } from '~/utils/crud';

definePageMeta({ layout: 'admin' });

const { t } = useI18n();

const columns = computed<CrudColumn[]>(() => [
  { key: 'name', label: t('GENERAL.NAME') },
  { key: 'slug', label: t('GENERAL.ADDRESS') },
  { key: 'sortOrder', label: t('GENERAL.SORT_ORDER'), alignsRight: true },
  { key: 'videoCount', label: t('ADMIN_VIDEO.VIDEOS_COLUMN'), alignsRight: true },
]);
const fields = computed<CrudField[]>(() => [
  { key: 'name', label: t('GENERAL.NAME'), kind: 'text', required: true },
  { key: 'slug', label: t('ADMIN_VIDEO.SLUG'), kind: 'text', hint: t('ADMIN_VIDEO.SLUG_HINT') },
  { key: 'sortOrder', label: t('GENERAL.SORT_ORDER'), kind: 'number', hint: t('ADMIN_VIDEO.SORT_ORDER_HINT') },
  { key: 'description', label: t('GENERAL.DESCRIPTION'), kind: 'textarea' },
]);

const slugOf = (row: object) => (row as { slug: string }).slug;
</script>

<template>
  <div>
    <AdminTabs :label="t('ADMIN_VIDEO.GALLERY')" :tabs="VIDEO_ADMIN_TABS" />
    <SimpleCrud
      resource="video-categories"
      :title="t('ADMIN_VIDEO.CATEGORIES_TITLE')"
      :subtitle="t('ADMIN_VIDEO.CATEGORIES_SUBTITLE')"
      :add-label="t('ADMIN_VIDEO.ADD_CATEGORY')"
      :columns="columns"
      :fields="fields"
      :empty-input="{ name: '', slug: '', sortOrder: 0, description: '' }"
    >
      <template #row-actions="{ row }">
        <BaseButton :to="routes.videoCategory(slugOf(row))" variant="ghost" size="sm">
          <AppIcon name="eye" />
          {{ t('ADMIN_VIDEO.VIEW') }}
        </BaseButton>
      </template>
    </SimpleCrud>
  </div>
</template>
