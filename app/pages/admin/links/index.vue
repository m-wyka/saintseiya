<script setup lang="ts">
import type { CrudColumn, CrudField } from '~/utils/crud';

definePageMeta({ layout: 'admin' });

const { t } = useI18n();

const columns = computed<CrudColumn[]>(() => [
  { key: 'title', label: t('GENERAL.TITLE') },
  { key: 'url', label: t('GENERAL.ADDRESS') },
  { key: 'categoryName', label: t('GENERAL.CATEGORY') },
]);

const categories = await $fetch<{ id: number; name: string }[]>('/api/admin/link-categories');

const fields = computed<CrudField[]>(() => [
  { key: 'title', label: t('GENERAL.TITLE'), kind: 'text', required: true },
  {
    key: 'categoryId',
    label: t('GENERAL.CATEGORY'),
    kind: 'select',
    required: true,
    options: categories.map(({ id, name }) => ({ value: id, label: name })),
    hint: categories.length ? undefined : t('ADMIN_LINKS.CATEGORY_REQUIRED_HINT'),
  },
  {
    key: 'url',
    label: t('ADMIN_LINKS.SITE_ADDRESS'),
    kind: 'url',
    required: true,
    hint: t('ADMIN_LINKS.SITE_ADDRESS_HINT'),
  },
  { key: 'description', label: t('GENERAL.DESCRIPTION'), kind: 'textarea' },
]);
const EMPTY_INPUT = { title: '', categoryId: categories[0]?.id ?? 0, url: '', description: '' };

const urlOf = (row: object) => (row as { url: string }).url;
</script>

<template>
  <div>
    <AdminTabs :label="t('ADMIN_LINKS.CATALOG')" :tabs="LINK_ADMIN_TABS" />
    <SimpleCrud
      resource="links"
      :title="t('ADMIN_NAV.LINKS')"
      :subtitle="t('ADMIN_LINKS.SUBTITLE')"
      :add-label="t('ADMIN_LINKS.ADD_LINK')"
      :remove-question="t('CONFIRM.DELETE_LINK')"
      :columns="columns"
      :fields="fields"
      :empty-input="EMPTY_INPUT"
      searchable
    >
      <template #cell-url="{ row }">
        <a
          :href="urlOf(row)"
          target="_blank"
          rel="noopener nofollow"
          class="inline-block max-w-xs truncate align-middle text-aqua-300 hover:text-gold-300"
        >
          {{ urlOf(row) }}
        </a>
      </template>
    </SimpleCrud>
  </div>
</template>
