<script setup lang="ts">
import type { CrudColumn, CrudField } from '~/utils/crud';

definePageMeta({ layout: 'admin' });

const COLUMNS: CrudColumn[] = [
  { key: 'title', label: 'Tytuł' },
  { key: 'url', label: 'Adres' },
  { key: 'categoryName', label: 'Kategoria' },
];

const categories = await $fetch<{ id: number; name: string }[]>('/api/admin/link-categories');

const FIELDS: CrudField[] = [
  { key: 'title', label: 'Tytuł', kind: 'text', required: true },
  {
    key: 'categoryId',
    label: 'Kategoria',
    kind: 'select',
    required: true,
    options: categories.map(({ id, name }) => ({ value: id, label: name })),
    hint: categories.length ? undefined : 'Najpierw dodaj kategorię w zakładce „Kategorie”',
  },
  {
    key: 'url',
    label: 'Adres strony',
    kind: 'url',
    required: true,
    hint: 'Pełny adres zaczynający się od http:// lub https://',
  },
  { key: 'description', label: 'Opis', kind: 'textarea' },
];
const EMPTY_INPUT = { title: '', categoryId: categories[0]?.id ?? 0, url: '', description: '' };

const urlOf = (row: object) => (row as { url: string }).url;
</script>

<template>
  <div>
    <AdminTabs label="Katalog linków" :tabs="LINK_ADMIN_TABS" />
    <SimpleCrud
      resource="links"
      title="Linki"
      subtitle="Zaprzyjaźnione strony pokazywane w katalogu linków."
      add-label="Dodaj link"
      :columns="COLUMNS"
      :fields="FIELDS"
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
