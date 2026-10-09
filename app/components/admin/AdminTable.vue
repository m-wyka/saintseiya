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
    <table class="w-full min-w-160 text-left text-sm">
      <thead class="border-b border-aqua-500/20 bg-black/40 text-[0.7rem] tracking-wide text-aqua-500 uppercase">
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            scope="col"
            class="px-4 py-2.5 font-semibold first:max-md:sticky first:max-md:left-0 first:max-md:z-10 first:max-md:max-w-44 first:max-md:min-w-36 first:max-md:bg-abyss-950"
            :class="{ 'text-right': column.alignsRight }"
          >
            {{ column.label }}
          </th>
          <th scope="col" class="px-4 py-2.5 text-right font-semibold">{{ t('GENERAL.ACTIONS') }}</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-aqua-500/10">
        <tr v-for="row in rows" :key="row.id" class="transition duration-150 hover:bg-white/5">
          <td
            v-for="column in columns"
            :key="column.key"
            class="px-4 py-2.5 align-middle text-aqua-200 first:max-md:sticky first:max-md:left-0 first:max-md:z-10 first:max-md:max-w-44 first:max-md:min-w-36 first:max-md:bg-abyss-900 first:max-md:wrap-break-word"
            :class="{ 'text-right tabular-nums': column.alignsRight }"
          >
            <slot :name="`cell-${column.key}`" :row="row">{{ cellText(row, column.key) }}</slot>
          </td>
          <td class="px-4 py-2.5 align-middle">
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
