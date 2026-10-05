<script setup lang="ts">
import { routes } from '#shared/utils/routes';
import type { CrudColumn, CrudField } from '~/utils/crud';

definePageMeta({ layout: 'admin' });

const { t } = useI18n();

const columns = computed<CrudColumn[]>(() => [
  { key: 'image', label: t('ADMIN_NEWS_CATEGORIES.IMAGE') },
  { key: 'name', label: t('GENERAL.NAME') },
  { key: 'slug', label: t('GENERAL.ADDRESS') },
  { key: 'newsCount', label: t('ADMIN_NEWS_CATEGORIES.NEWS_COUNT'), alignsRight: true },
]);
const fields = computed<CrudField[]>(() => [
  { key: 'name', label: t('GENERAL.NAME'), kind: 'text', required: true },
  { key: 'slug', label: t('ADMIN_NEWS_CATEGORIES.SLUG'), kind: 'text', hint: t('ADMIN_NEWS_CATEGORIES.SLUG_HINT') },
  {
    key: 'image',
    label: t('ADMIN_NEWS_CATEGORIES.CATEGORY_IMAGE'),
    kind: 'image',
    hint: t('ADMIN_NEWS_CATEGORIES.CATEGORY_IMAGE_HINT'),
  },
]);

const imageOf = (row: object): string | null => (row as { image?: string | null }).image ?? null;
</script>

<template>
  <SimpleCrud
    resource="news-categories"
    :title="t('ADMIN_NAV.NEWS_CATEGORIES')"
    :add-label="t('ADMIN_NEWS_CATEGORIES.ADD')"
    :columns="columns"
    :fields="fields"
    :empty-input="{ name: '', slug: '', image: null }"
  >
    <template #cell-image="{ row }">
      <img
        v-if="imageOf(row)"
        :src="routes.media(imageOf(row)!)"
        alt=""
        class="h-12 w-9 rounded-sm border border-gold-300/40 object-cover"
      />
    </template>
  </SimpleCrud>
</template>
