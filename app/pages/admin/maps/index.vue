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

const { t } = useI18n();

const columns = computed(() => [
  { key: 'title', label: t('ADMIN_MAPS.MAP_COLUMN') },
  { key: 'status', label: t('GENERAL.STATUS') },
  { key: 'areaCount', label: t('ADMIN_MAPS.AREAS_COLUMN'), alignsRight: true },
]);

const { rows, isLoading, remove } = useAdminList<MapRow>('maps');

useSeoMeta({ title: () => t('ADMIN_NAV.MAPS') });
</script>

<template>
  <div>
    <AdminHeader :title="t('ADMIN_MAPS.TITLE')" :subtitle="t('ADMIN_MAPS.SUBTITLE')">
      <BaseButton to="/admin/mapy/nowy">
        <AppIcon name="plus" />
        {{ t('ADMIN_MAPS.ADD_MAP') }}
      </BaseButton>
    </AdminHeader>
    <AdminTable :columns="columns" :rows="rows" :is-loading="isLoading">
      <template #cell-title="{ row }">
        <NuxtLinkLocale :to="`/admin/mapy/${row.id}`" class="font-semibold text-gold-300 hover:text-cosmo-400">{{
          row.title
        }}</NuxtLinkLocale>
      </template>
      <template #cell-status="{ row }">
        <StatusBadge :status="row.status" />
      </template>
      <template #actions="{ row }">
        <BaseButton v-if="row.status === 'published'" :to="routes.map(row.slug)" variant="ghost" size="sm">
          <AppIcon name="eye" />
          {{ t('ADMIN_MAPS.VIEW') }}
        </BaseButton>
        <BaseButton :to="`/admin/mapy/${row.id}`" variant="ghost" size="sm">
          <AppIcon name="edit" />
          {{ t('GENERAL.EDIT') }}
        </BaseButton>
        <ConfirmButton @confirm="remove(row.id)" />
      </template>
    </AdminTable>
  </div>
</template>
