<script setup lang="ts">
import { routes } from '#shared/utils/routes';

definePageMeta({ layout: 'admin' });

interface DownloadRow {
  id: number;
  title: string;
  description: string;
  file: string;
  fileSize: number;
  downloadCount: number;
  createdAt: string;
}

const NEW_DOWNLOAD_FORM = 'new';

const { t } = useI18n();

const columns = computed(() => [
  { key: 'title', label: t('GENERAL.TITLE') },
  { key: 'fileSize', label: t('ADMIN_DOWNLOADS.FILE_SIZE'), alignsRight: true },
  { key: 'downloadCount', label: t('ADMIN_DOWNLOADS.DOWNLOAD_COUNT'), alignsRight: true },
  { key: 'createdAt', label: t('ADMIN_DOWNLOADS.ADDED') },
]);

const { rows, total, isLoading, refresh, remove } = useAdminList<DownloadRow>('downloads');
const editedDownload = ref<DownloadRow | null>(null);
const isFormOpen = ref(false);

const openNew = () => {
  editedDownload.value = null;
  isFormOpen.value = true;
};

const openExisting = (download: DownloadRow) => {
  editedDownload.value = download;
  isFormOpen.value = true;
};

const closeForm = () => {
  isFormOpen.value = false;
};

const showSaved = async () => {
  closeForm();
  await refresh();
};

useSeoMeta({ title: () => t('ADMIN_NAV.DOWNLOADS') });
</script>

<template>
  <div>
    <AdminHeader
      :title="t('ADMIN_NAV.DOWNLOADS')"
      :subtitle="t('ADMIN_DOWNLOADS.FILE_COUNT', { count: formatNumber(total) }, total)"
    >
      <BaseButton @click="openNew">
        <AppIcon name="plus" />
        {{ t('ADMIN_DOWNLOADS.ADD') }}
      </BaseButton>
    </AdminHeader>

    <DownloadForm
      v-if="isFormOpen"
      :key="editedDownload?.id ?? NEW_DOWNLOAD_FORM"
      :download="editedDownload"
      @saved="showSaved"
      @cancel="closeForm"
    />

    <AdminTable :columns="columns" :rows="rows" :is-loading="isLoading" :empty-message="t('ADMIN_DOWNLOADS.EMPTY')">
      <template #cell-title="{ row }">
        <a :href="routes.media(row.file)" class="font-semibold text-gold-300 hover:text-cosmo-400">{{ row.title }}</a>
        <span v-if="row.description" class="line-clamp-2 max-w-md text-xs text-aqua-300">{{ row.description }}</span>
      </template>
      <template #cell-fileSize="{ row }">
        <span class="whitespace-nowrap">{{ formatFileSize(row.fileSize) }}</span>
      </template>
      <template #cell-downloadCount="{ row }">{{ formatNumber(row.downloadCount) }}</template>
      <template #cell-createdAt="{ row }">
        <time :datetime="row.createdAt" class="whitespace-nowrap">{{ formatLongDate(row.createdAt) }}</time>
      </template>
      <template #actions="{ row }">
        <BaseButton variant="ghost" size="sm" @click="openExisting(row)">
          <AppIcon name="edit" />
          {{ t('GENERAL.EDIT') }}
        </BaseButton>
        <ConfirmButton @confirm="remove(row.id)" />
      </template>
    </AdminTable>
  </div>
</template>
