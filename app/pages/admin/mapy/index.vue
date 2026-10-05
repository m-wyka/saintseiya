<script setup lang="ts">
import type { ContentStatus } from '#shared/utils/content';
import { routes } from '#shared/utils/routes';

definePageMeta({ layout: 'admin' });

interface MapRow {
  id: number;
  title: string;
  slug: string;
  status: ContentStatus;
  teaserImage: string | null;
  areaCount: number;
}

const COLUMNS = [
  { key: 'title', label: 'Mapa' },
  { key: 'status', label: 'Status' },
  { key: 'areaCount', label: 'Obszarów', alignsRight: true },
];

const { rows, isLoading, remove } = useAdminList<MapRow>('maps');

useSeoMeta({ title: 'Mapy' });
</script>

<template>
  <div>
    <AdminHeader title="Mapy interaktywne" subtitle="Obraz z klikalnymi obszarami, które prowadzą do treści.">
      <BaseButton to="/admin/mapy/nowy">
        <AppIcon name="plus" />
        Dodaj mapę
      </BaseButton>
    </AdminHeader>
    <AdminTable :columns="COLUMNS" :rows="rows" :is-loading="isLoading">
      <template #cell-title="{ row }">
        <NuxtLink :to="`/admin/mapy/${row.id}`" class="font-semibold text-gold-300 hover:text-cosmo-400">{{
          row.title
        }}</NuxtLink>
      </template>
      <template #cell-status="{ row }">
        <StatusBadge :status="row.status" />
      </template>
      <template #actions="{ row }">
        <BaseButton v-if="row.status === 'published'" :to="routes.map(row.slug)" variant="ghost" size="sm">
          <AppIcon name="eye" />
          Zobacz
        </BaseButton>
        <BaseButton :to="`/admin/mapy/${row.id}`" variant="ghost" size="sm">
          <AppIcon name="edit" />
          Edytuj
        </BaseButton>
        <ConfirmButton @confirm="remove(row.id)" />
      </template>
    </AdminTable>
  </div>
</template>
