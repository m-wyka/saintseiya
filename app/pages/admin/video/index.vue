<script setup lang="ts">
import type { CrudColumn, CrudField } from '~/utils/crud';

definePageMeta({ layout: 'admin' });

interface VideoRow {
  title: string;
  youtubeId: string;
  createdAt: string;
}

const { t } = useI18n();

const columns = computed<CrudColumn[]>(() => [
  { key: 'youtubeId', label: t('ADMIN_VIDEO.PREVIEW') },
  { key: 'title', label: t('GENERAL.TITLE') },
  { key: 'categoryName', label: t('GENERAL.CATEGORY') },
  { key: 'createdAt', label: t('ADMIN_VIDEO.ADDED') },
]);

const categories = await $fetch<{ id: number; name: string }[]>('/api/admin/video-categories');

const fields = computed<CrudField[]>(() => [
  { key: 'title', label: t('GENERAL.TITLE'), kind: 'text', required: true },
  {
    key: 'categoryId',
    label: t('GENERAL.CATEGORY'),
    kind: 'select',
    required: true,
    options: categories.map(({ id, name }) => ({ value: id, label: name })),
    hint: categories.length ? undefined : t('ADMIN_VIDEO.CATEGORY_REQUIRED_HINT'),
  },
  {
    key: 'youtubeId',
    label: t('ADMIN_VIDEO.YOUTUBE_VIDEO'),
    kind: 'text',
    required: true,
    hint: t('ADMIN_VIDEO.YOUTUBE_VIDEO_HINT'),
  },
  { key: 'description', label: t('GENERAL.DESCRIPTION'), kind: 'textarea' },
]);
const EMPTY_INPUT = { title: '', categoryId: categories[0]?.id ?? 0, youtubeId: '', description: '' };

const videoOf = (row: object) => row as VideoRow;
const watchUrlOf = (row: object) => `https://www.youtube.com/watch?v=${videoOf(row).youtubeId}`;
const posterUrlOf = (row: object) => `https://i.ytimg.com/vi/${videoOf(row).youtubeId}/default.jpg`;
</script>

<template>
  <div>
    <AdminTabs :label="t('ADMIN_VIDEO.GALLERY')" :tabs="VIDEO_ADMIN_TABS" />
    <SimpleCrud
      resource="videos"
      :title="t('ADMIN_NAV.VIDEOS')"
      :subtitle="t('ADMIN_VIDEO.SUBTITLE')"
      :add-label="t('ADMIN_VIDEO.ADD_VIDEO')"
      :remove-question="t('CONFIRM.DELETE_VIDEO')"
      :columns="columns"
      :fields="fields"
      :empty-input="EMPTY_INPUT"
      searchable
    >
      <template #cell-youtubeId="{ row }">
        <a
          :href="watchUrlOf(row)"
          target="_blank"
          rel="noopener"
          class="inline-block"
          :aria-label="t('ADMIN_VIDEO.OPEN_IN_YOUTUBE', { title: videoOf(row).title })"
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
