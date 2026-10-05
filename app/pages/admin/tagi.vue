<script setup lang="ts">
import type { CrudColumn, CrudField } from '~/utils/crud';

definePageMeta({ layout: 'admin' });

const COLUMNS: CrudColumn[] = [
  { key: 'name', label: 'Nazwa' },
  { key: 'slug', label: 'Adres' },
  { key: 'usageCount', label: 'Użyć', alignsRight: true },
];
const FIELDS: CrudField[] = [
  { key: 'name', label: 'Nazwa', kind: 'text', required: true },
  { key: 'slug', label: 'Adres (slug)', kind: 'text', hint: 'Puste pole = adres utworzy się z nazwy' },
];
</script>

<template>
  <SimpleCrud
    resource="tags"
    title="Tagi"
    add-label="Dodaj tag"
    :columns="COLUMNS"
    :fields="FIELDS"
    :empty-input="{ name: '', slug: '' }"
  />
</template>
