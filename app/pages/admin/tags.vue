<script setup lang="ts">
import type { CrudColumn, CrudField } from '~/utils/crud';

definePageMeta({ layout: 'admin' });

const { t } = useI18n();

const columns = computed<CrudColumn[]>(() => [
  { key: 'name', label: t('GENERAL.NAME') },
  { key: 'slug', label: t('GENERAL.ADDRESS') },
  { key: 'usageCount', label: t('ADMIN_TAGS.USAGE_COUNT'), alignsRight: true },
]);
const fields = computed<CrudField[]>(() => [
  { key: 'name', label: t('GENERAL.NAME'), kind: 'text', required: true },
  { key: 'slug', label: t('ADMIN_TAGS.SLUG'), kind: 'text', hint: t('ADMIN_TAGS.SLUG_HINT') },
]);
</script>

<template>
  <SimpleCrud
    resource="tags"
    :title="t('ADMIN_NAV.TAGS')"
    :add-label="t('ADMIN_TAGS.ADD')"
    :columns="columns"
    :fields="fields"
    :empty-input="{ name: '', slug: '' }"
  />
</template>
