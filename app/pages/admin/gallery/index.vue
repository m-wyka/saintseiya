<script setup lang="ts">
import { routes } from '#shared/utils/routes';
import type { CrudColumn, CrudField } from '~/utils/crud';

definePageMeta({ layout: 'admin' });

const COLUMNS: CrudColumn[] = [
  { key: 'coverImage', label: 'Okładka' },
  { key: 'title', label: 'Tytuł' },
  { key: 'slug', label: 'Adres' },
  { key: 'photoCount', label: 'Zdjęć', alignsRight: true },
  { key: 'sortOrder', label: 'Kolejność', alignsRight: true },
];
const FIELDS: CrudField[] = [
  { key: 'title', label: 'Tytuł', kind: 'text', required: true },
  { key: 'slug', label: 'Adres (slug)', kind: 'text', hint: 'Puste pole = adres utworzy się z tytułu' },
  { key: 'description', label: 'Opis', kind: 'textarea' },
  { key: 'sortOrder', label: 'Kolejność', kind: 'number', hint: 'Albumy z mniejszą liczbą są wyżej na liście' },
];

const photosPathOf = (row: { id: number }) => `/admin/galeria/${row.id}`;
const coverOf = (row: object): string | null => (row as { coverImage?: string | null }).coverImage ?? null;
</script>

<template>
  <SimpleCrud
    resource="albums"
    title="Galeria"
    subtitle="Okładkę albumu wybierasz spośród jego zdjęć. Album można usunąć dopiero po usunięciu wszystkich jego zdjęć."
    add-label="Dodaj album"
    :columns="COLUMNS"
    :fields="FIELDS"
    :empty-input="{ title: '', slug: '', description: '', sortOrder: 0 }"
  >
    <template #cell-coverImage="{ row }">
      <img
        v-if="coverOf(row)"
        :src="routes.media(coverOf(row)!)"
        alt=""
        class="h-12 w-16 rounded-sm border border-gold-300/40 object-cover"
      />
      <span v-else class="grid h-12 w-16 place-items-center rounded-sm border border-dashed border-aqua-500/30">
        <AppIcon name="image" class="text-aqua-500" />
      </span>
    </template>
    <template #cell-title="{ row }">
      <NuxtLink :to="photosPathOf(row)" class="font-semibold text-gold-300 hover:text-cosmo-400">{{
        cellText(row, 'title')
      }}</NuxtLink>
    </template>
    <template #row-actions="{ row }">
      <BaseButton :to="photosPathOf(row)" variant="ghost" size="sm">
        <AppIcon name="image" />
        Zdjęcia
      </BaseButton>
    </template>
  </SimpleCrud>
</template>
