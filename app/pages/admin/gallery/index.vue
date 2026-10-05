<script setup lang="ts">
import { routes } from '#shared/utils/routes';
import type { CrudColumn, CrudField } from '~/utils/crud';

definePageMeta({ layout: 'admin' });

const { t } = useI18n();

const columns = computed<CrudColumn[]>(() => [
  { key: 'coverImage', label: t('ADMIN_GALLERY.COVER') },
  { key: 'title', label: t('GENERAL.TITLE') },
  { key: 'slug', label: t('GENERAL.ADDRESS') },
  { key: 'photoCount', label: t('ADMIN_GALLERY.PHOTOS_COLUMN'), alignsRight: true },
  { key: 'sortOrder', label: t('GENERAL.SORT_ORDER'), alignsRight: true },
]);
const fields = computed<CrudField[]>(() => [
  { key: 'title', label: t('GENERAL.TITLE'), kind: 'text', required: true },
  { key: 'slug', label: t('ADMIN_GALLERY.SLUG'), kind: 'text', hint: t('ADMIN_GALLERY.SLUG_HINT') },
  { key: 'description', label: t('GENERAL.DESCRIPTION'), kind: 'textarea' },
  { key: 'sortOrder', label: t('GENERAL.SORT_ORDER'), kind: 'number', hint: t('ADMIN_GALLERY.SORT_ORDER_HINT') },
]);

const photosPathOf = (row: { id: number }) => `/admin/galeria/${row.id}`;
const coverOf = (row: object): string | null => (row as { coverImage?: string | null }).coverImage ?? null;
</script>

<template>
  <SimpleCrud
    resource="albums"
    :title="t('ADMIN_NAV.GALLERY')"
    :subtitle="t('ADMIN_GALLERY.SUBTITLE')"
    :add-label="t('ADMIN_GALLERY.ADD_ALBUM')"
    :columns="columns"
    :fields="fields"
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
      <NuxtLinkLocale :to="photosPathOf(row)" class="font-semibold text-gold-300 hover:text-cosmo-400">{{
        cellText(row, 'title')
      }}</NuxtLinkLocale>
    </template>
    <template #row-actions="{ row }">
      <BaseButton :to="photosPathOf(row)" variant="ghost" size="sm">
        <AppIcon name="image" />
        {{ t('ADMIN_GALLERY.PHOTOS') }}
      </BaseButton>
    </template>
  </SimpleCrud>
</template>
