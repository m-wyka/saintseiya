<script setup lang="ts">
import { FORUM_ADMIN_TABS } from '~/utils/adminTabs';
import type { CrudColumn, CrudField } from '~/utils/crud';

definePageMeta({ layout: 'admin' });

const COLUMNS: CrudColumn[] = [
  { key: 'name', label: 'Nazwa' },
  { key: 'sortOrder', label: 'Kolejność', alignsRight: true },
  { key: 'forumCount', label: 'Działów', alignsRight: true },
];
const FIELDS: CrudField[] = [
  { key: 'name', label: 'Nazwa', kind: 'text', required: true },
  { key: 'sortOrder', label: 'Kolejność', kind: 'number', hint: 'Mniejsza liczba = wyżej na liście' },
];
</script>

<template>
  <div>
    <AdminTabs label="Struktura forum" :tabs="FORUM_ADMIN_TABS" />
    <SimpleCrud
      resource="forum-categories"
      title="Kategorie forum"
      subtitle="Kategorię da się usunąć dopiero wtedy, gdy nie ma w niej żadnego działu."
      add-label="Dodaj kategorię"
      :columns="COLUMNS"
      :fields="FIELDS"
      :empty-input="{ name: '', sortOrder: 0 }"
    />
  </div>
</template>
