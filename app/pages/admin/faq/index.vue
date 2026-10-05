<script setup lang="ts">
import type { CrudColumn, CrudField } from '~/utils/crud';

definePageMeta({ layout: 'admin' });

const { t } = useI18n();

const columns = computed<CrudColumn[]>(() => [
  { key: 'title', label: t('GENERAL.TITLE') },
  { key: 'categoryName', label: t('GENERAL.CATEGORY') },
  { key: 'sortOrder', label: t('GENERAL.SORT_ORDER'), alignsRight: true },
]);

const categories = await $fetch<{ id: number; name: string }[]>('/api/admin/faq-categories');

const fields = computed<CrudField[]>(() => [
  { key: 'title', label: t('GENERAL.TITLE'), kind: 'text', required: true },
  {
    key: 'categoryId',
    label: t('GENERAL.CATEGORY'),
    kind: 'select',
    required: true,
    options: categories.map(({ id, name }) => ({ value: id, label: name })),
    hint: categories.length ? undefined : t('ADMIN_FAQ.CATEGORY_REQUIRED_HINT'),
  },
  { key: 'descriptionHtml', label: t('GENERAL.DESCRIPTION'), kind: 'richText' },
  { key: 'sortOrder', label: t('GENERAL.SORT_ORDER'), kind: 'number', hint: t('ADMIN_FAQ.SORT_ORDER_HINT') },
]);
const EMPTY_INPUT = { title: '', categoryId: categories[0]?.id ?? 0, descriptionHtml: '', sortOrder: 0 };
</script>

<template>
  <div>
    <AdminTabs :label="t('ADMIN_NAV.FAQ')" :tabs="FAQ_ADMIN_TABS" />
    <SimpleCrud
      resource="faq-items"
      :title="t('ADMIN_NAV.FAQ')"
      :subtitle="t('ADMIN_FAQ.SUBTITLE')"
      :add-label="t('ADMIN_FAQ.ADD_ITEM')"
      :remove-question="t('CONFIRM.DELETE_FAQ_ITEM')"
      :columns="columns"
      :fields="fields"
      :empty-input="EMPTY_INPUT"
      searchable
    />
  </div>
</template>
