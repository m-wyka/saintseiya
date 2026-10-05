<script setup lang="ts">
import { FORUM_ADMIN_TABS } from '~/utils/adminTabs';
import { routes } from '#shared/utils/routes';
import type { CrudColumn, CrudField } from '~/utils/crud';

definePageMeta({ layout: 'admin' });

interface ForumRow {
  slug: string;
  isStaffOnly: boolean;
}

const COLUMNS: CrudColumn[] = [
  { key: 'name', label: 'Nazwa' },
  { key: 'categoryName', label: 'Kategoria' },
  { key: 'slug', label: 'Adres' },
  { key: 'isStaffOnly', label: 'Dostęp' },
  { key: 'sortOrder', label: 'Kolejność', alignsRight: true },
  { key: 'threadCount', label: 'Tematów', alignsRight: true },
  { key: 'postCount', label: 'Postów', alignsRight: true },
];

const categories = await $fetch<{ id: number; name: string }[]>('/api/admin/forum-categories');

const FIELDS: CrudField[] = [
  { key: 'name', label: 'Nazwa', kind: 'text', required: true },
  {
    key: 'categoryId',
    label: 'Kategoria',
    kind: 'select',
    required: true,
    options: categories.map(({ id, name }) => ({ value: id, label: name })),
  },
  { key: 'slug', label: 'Adres (slug)', kind: 'text', hint: 'Puste pole = adres utworzy się z nazwy' },
  { key: 'sortOrder', label: 'Kolejność', kind: 'number', hint: 'Mniejsza liczba = wyżej na liście' },
  { key: 'description', label: 'Opis', kind: 'textarea' },
  {
    key: 'isStaffOnly',
    label: 'Tylko dla redakcji',
    kind: 'checkbox',
    hint: 'Dział widzą i piszą w nim wyłącznie moderatorzy i administratorzy',
  },
];
const EMPTY_INPUT = {
  name: '',
  categoryId: categories[0]?.id ?? 0,
  slug: '',
  sortOrder: 0,
  description: '',
  isStaffOnly: false,
};

const forumOf = (row: object) => row as ForumRow;
</script>

<template>
  <div>
    <AdminTabs label="Struktura forum" :tabs="FORUM_ADMIN_TABS" />
    <SimpleCrud
      resource="forums"
      title="Działy forum"
      subtitle="Dział da się usunąć dopiero wtedy, gdy nie ma w nim żadnego tematu."
      add-label="Dodaj dział"
      :columns="COLUMNS"
      :fields="FIELDS"
      :empty-input="EMPTY_INPUT"
    >
      <template #cell-isStaffOnly="{ row }">
        <StateBadge v-if="forumOf(row).isStaffOnly" label="Redakcja" icon="lock" tone="muted" />
        <StateBadge v-else label="Publiczny" icon="eye" tone="positive" />
      </template>
      <template #row-actions="{ row }">
        <BaseButton :to="routes.forum(forumOf(row).slug)" variant="ghost" size="sm">
          <AppIcon name="eye" />
          Zobacz
        </BaseButton>
      </template>
    </SimpleCrud>
  </div>
</template>
