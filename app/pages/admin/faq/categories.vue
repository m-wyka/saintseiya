<script setup lang="ts">
import type { CrudColumn, CrudField } from '~/utils/crud';

definePageMeta({ layout: 'admin' });

const { t } = useI18n();

const columns = computed<CrudColumn[]>(() => [
  { key: 'name', label: t('GENERAL.NAME') },
  { key: 'sortOrder', label: t('GENERAL.SORT_ORDER'), alignsRight: true },
  { key: 'itemCount', label: t('ADMIN_FAQ.ITEMS_COLUMN'), alignsRight: true },
]);
const fields = computed<CrudField[]>(() => [
  { key: 'name', label: t('GENERAL.NAME'), kind: 'text', required: true },
  { key: 'sortOrder', label: t('GENERAL.SORT_ORDER'), kind: 'number', hint: t('ADMIN_FAQ.SORT_ORDER_HINT') },
]);
</script>

<template>
  <div>
    <AdminTabs :label="t('ADMIN_NAV.FAQ')" :tabs="FAQ_ADMIN_TABS" />
    <SimpleCrud
      resource="faq-categories"
      :title="t('ADMIN_FAQ.CATEGORIES_TITLE')"
      :subtitle="t('ADMIN_FAQ.CATEGORIES_SUBTITLE')"
      :add-label="t('ADMIN_FAQ.ADD_CATEGORY')"
      :remove-question="t('CONFIRM.DELETE_CATEGORY')"
      :columns="columns"
      :fields="fields"
      :empty-input="{ name: '', sortOrder: 0 }"
    />
  </div>
</template>
