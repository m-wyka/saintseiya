<script setup lang="ts">
import { FORUM_ADMIN_TABS } from '~/utils/adminTabs';
import type { CrudColumn, CrudField } from '~/utils/crud';

definePageMeta({ layout: 'admin' });

const { t } = useI18n();

const columns = computed<CrudColumn[]>(() => [
  { key: 'name', label: t('GENERAL.NAME') },
  { key: 'sortOrder', label: t('GENERAL.SORT_ORDER'), alignsRight: true },
  { key: 'forumCount', label: t('ADMIN_FORUM.SECTIONS_COLUMN'), alignsRight: true },
]);
const fields = computed<CrudField[]>(() => [
  { key: 'name', label: t('GENERAL.NAME'), kind: 'text', required: true },
  { key: 'sortOrder', label: t('GENERAL.SORT_ORDER'), kind: 'number', hint: t('ADMIN_FORUM.SORT_ORDER_HINT') },
]);
</script>

<template>
  <div>
    <AdminTabs :label="t('ADMIN_FORUM.STRUCTURE')" :tabs="FORUM_ADMIN_TABS" />
    <SimpleCrud
      resource="forum-categories"
      :title="t('ADMIN_FORUM.CATEGORIES_TITLE')"
      :subtitle="t('ADMIN_FORUM.CATEGORIES_SUBTITLE')"
      :add-label="t('ADMIN_FORUM.ADD_CATEGORY')"
      :remove-question="t('CONFIRM.DELETE_CATEGORY')"
      :columns="columns"
      :fields="fields"
      :empty-input="{ name: '', sortOrder: 0 }"
    />
  </div>
</template>
