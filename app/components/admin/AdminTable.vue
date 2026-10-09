<script setup lang="ts" generic="Row extends { id: number }">
import type { CrudColumn } from '~/utils/crud';

const props = defineProps<{
  columns: CrudColumn[];
  rows: Row[];
  isLoading?: boolean;
  emptyMessage?: string;
}>();

const { t } = useI18n();

const NAMING_KEYS = ['title', 'name', 'question', 'label'];

const rowLabel = (row: Row): string => {
  const values = row as Record<string, unknown>;
  const candidateKeys = [...NAMING_KEYS, ...props.columns.map((column) => column.key)];
  const namingKey = candidateKeys.find((key) => typeof values[key] === 'string' && values[key]);
  return namingKey ? String(values[namingKey]) : t('ADMIN_UI.ROW_FALLBACK_NAME', { id: row.id });
};
</script>

<template>
  <div class="overflow-x-auto panel" :class="{ 'opacity-60': isLoading }">
    <!-- Explicit roles keep the table readable to assistive technology when the rows turn into cards on a phone. -->
    <table class="admin-table w-full text-left text-sm md:min-w-160" role="table">
      <thead
        class="border-b border-aqua-500/20 bg-black/40 text-[0.7rem] tracking-wide text-aqua-500 uppercase max-md:sr-only"
        role="rowgroup"
      >
        <tr role="row">
          <th
            v-for="column in columns"
            :key="column.key"
            scope="col"
            role="columnheader"
            class="px-4 py-2.5 font-semibold"
            :class="{ 'text-right': column.alignsRight }"
          >
            {{ column.label }}
          </th>
          <th
            scope="col"
            role="columnheader"
            class="px-4 py-2.5 text-right font-semibold md:sticky md:right-0 md:bg-abyss-950"
          >
            {{ t('GENERAL.ACTIONS') }}
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-aqua-500/10" role="rowgroup">
        <tr v-for="row in rows" :key="row.id" role="row" class="transition duration-150 hover:bg-white/5">
          <td
            v-for="(column, columnIndex) in columns"
            :key="column.key"
            role="cell"
            class="px-4 py-2.5 align-middle text-aqua-200"
            :class="{ 'text-right tabular-nums': column.alignsRight }"
            :data-label="columnIndex > 0 ? column.label : undefined"
          >
            <slot :name="`cell-${column.key}`" :row="row">{{ cellText(row, column.key) }}</slot>
          </td>
          <td
            role="cell"
            class="px-4 py-2.5 align-middle md:sticky md:right-0 md:bg-abyss-900 md:shadow-[-12px_0_12px_-12px_rgb(0_0_0/0.7)]"
          >
            <div
              class="flex items-center justify-end gap-1.5"
              role="group"
              :aria-label="t('ADMIN_UI.ROW_ACTIONS', { name: rowLabel(row) })"
            >
              <slot name="actions" :row="row" />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-if="!rows.length" class="px-4 py-10 text-center text-sm text-aqua-500">
      {{ emptyMessage ?? t('ADMIN_UI.EMPTY_TABLE') }}
    </p>
  </div>
</template>
