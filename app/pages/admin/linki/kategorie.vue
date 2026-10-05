<script setup lang="ts">
import type { CrudColumn, CrudField } from '~/utils/crud';

definePageMeta({ layout: 'admin' });

const COLUMNS: CrudColumn[] = [
  { key: 'name', label: 'Nazwa' },
  { key: 'sortOrder', label: 'Kolejność', alignsRight: true },
  { key: 'linkCount', label: 'Linków', alignsRight: true },
];
const FIELDS: CrudField[] = [
  { key: 'name', label: 'Nazwa', kind: 'text', required: true },
  { key: 'sortOrder', label: 'Kolejność', kind: 'number', hint: 'Mniejsza liczba = wyżej na liście' },
];
</script>

<template>
  <div>
    <AdminTabs label="Katalog linków" :tabs="LINK_ADMIN_TABS" />
    <SimpleCrud
      resource="link-categories"
      title="Kategorie linków"
      subtitle="Kategoria bez linków nie pokazuje się na stronie. Usunąć da się tylko pustą."
      add-label="Dodaj kategorię"
      :columns="COLUMNS"
      :fields="FIELDS"
      :empty-input="{ name: '', sortOrder: 0 }"
    />
  </div>
</template>
