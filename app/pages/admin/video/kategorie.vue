<script setup lang="ts">
import { routes } from '#shared/utils/routes';
import type { CrudColumn, CrudField } from '~/utils/crud';

definePageMeta({ layout: 'admin' });

const COLUMNS: CrudColumn[] = [
  { key: 'name', label: 'Nazwa' },
  { key: 'slug', label: 'Adres' },
  { key: 'sortOrder', label: 'Kolejność', alignsRight: true },
  { key: 'videoCount', label: 'Filmów', alignsRight: true },
];
const FIELDS: CrudField[] = [
  { key: 'name', label: 'Nazwa', kind: 'text', required: true },
  { key: 'slug', label: 'Adres (slug)', kind: 'text', hint: 'Puste pole = adres utworzy się z nazwy' },
  { key: 'sortOrder', label: 'Kolejność', kind: 'number', hint: 'Mniejsza liczba = wyżej na liście' },
  { key: 'description', label: 'Opis', kind: 'textarea' },
];

const slugOf = (row: object) => (row as { slug: string }).slug;
</script>

<template>
  <div>
    <AdminTabs label="Galeria video" :tabs="VIDEO_ADMIN_TABS" />
    <SimpleCrud
      resource="video-categories"
      title="Kategorie filmów"
      subtitle="Kategorię da się usunąć dopiero wtedy, gdy nie ma w niej żadnego filmu."
      add-label="Dodaj kategorię"
      :columns="COLUMNS"
      :fields="FIELDS"
      :empty-input="{ name: '', slug: '', sortOrder: 0, description: '' }"
    >
      <template #row-actions="{ row }">
        <BaseButton :to="routes.videoCategory(slugOf(row))" variant="ghost" size="sm">
          <AppIcon name="eye" />
          Zobacz
        </BaseButton>
      </template>
    </SimpleCrud>
  </div>
</template>
