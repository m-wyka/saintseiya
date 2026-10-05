<script setup lang="ts">
import type { CrudColumn, CrudField } from '~/utils/crud';

definePageMeta({ layout: 'admin' });

interface VideoRow {
  title: string;
  youtubeId: string;
  createdAt: string;
}

const COLUMNS: CrudColumn[] = [
  { key: 'youtubeId', label: 'Podgląd' },
  { key: 'title', label: 'Tytuł' },
  { key: 'categoryName', label: 'Kategoria' },
  { key: 'createdAt', label: 'Dodano' },
];

const categories = await $fetch<{ id: number; name: string }[]>('/api/admin/video-categories');

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
    key: 'youtubeId',
    label: 'Film z YouTube',
    kind: 'text',
    required: true,
    hint: 'Adres filmu (youtube.com lub youtu.be) albo jego 11-znakowy identyfikator',
  },
  { key: 'description', label: 'Opis', kind: 'textarea' },
];
const EMPTY_INPUT = { title: '', categoryId: categories[0]?.id ?? 0, youtubeId: '', description: '' };

const videoOf = (row: object) => row as VideoRow;
const watchUrlOf = (row: object) => `https://www.youtube.com/watch?v=${videoOf(row).youtubeId}`;
const posterUrlOf = (row: object) => `https://i.ytimg.com/vi/${videoOf(row).youtubeId}/default.jpg`;
</script>

<template>
  <div>
    <AdminTabs label="Galeria video" :tabs="VIDEO_ADMIN_TABS" />
    <SimpleCrud
      resource="videos"
      title="Filmy"
      subtitle="Filmy z YouTube pokazywane w galerii video."
      add-label="Dodaj film"
      :columns="COLUMNS"
      :fields="FIELDS"
      :empty-input="EMPTY_INPUT"
      searchable
    >
      <template #cell-youtubeId="{ row }">
        <a
          :href="watchUrlOf(row)"
          target="_blank"
          rel="noopener"
          class="inline-block"
          :aria-label="`Otwórz w YouTube: ${videoOf(row).title}`"
        >
          <img
            :src="posterUrlOf(row)"
            alt=""
            loading="lazy"
            class="h-12 w-16 rounded-sm border border-aqua-500/30 object-cover transition duration-150 hover:border-cosmo-500"
          />
        </a>
      </template>
      <template #cell-createdAt="{ row }">
        <time :datetime="videoOf(row).createdAt" class="whitespace-nowrap">
          {{ formatLongDate(videoOf(row).createdAt) }}
        </time>
      </template>
    </SimpleCrud>
  </div>
</template>
