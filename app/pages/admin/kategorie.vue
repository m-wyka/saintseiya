<script setup lang="ts">
import { routes } from '#shared/utils/routes';
import type { CrudColumn, CrudField } from '~/utils/crud';

definePageMeta({ layout: 'admin' });

const COLUMNS: CrudColumn[] = [
  { key: 'image', label: 'Grafika' },
  { key: 'name', label: 'Nazwa' },
  { key: 'slug', label: 'Adres' },
  { key: 'newsCount', label: 'Newsów', alignsRight: true },
];
const FIELDS: CrudField[] = [
  { key: 'name', label: 'Nazwa', kind: 'text', required: true },
  { key: 'slug', label: 'Adres (slug)', kind: 'text', hint: 'Puste pole = adres utworzy się z nazwy' },
  { key: 'image', label: 'Grafika kategorii', kind: 'image', hint: 'Najlepiej w proporcji 3:4, np. 150×200 px' },
];

const imageOf = (row: object): string | null => (row as { image?: string | null }).image ?? null;
</script>

<template>
  <SimpleCrud
    resource="news-categories"
    title="Kategorie newsów"
    add-label="Dodaj kategorię"
    :columns="COLUMNS"
    :fields="FIELDS"
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
