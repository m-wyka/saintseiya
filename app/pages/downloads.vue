<script setup lang="ts">
const { t } = useI18n();
const { data: downloads } = await useFetch('/api/downloads');

useSeoMeta({ title: () => t('DOWNLOADS.TITLE') });
</script>

<template>
  <div>
    <PageHeading :title="t('DOWNLOADS.TITLE')" />
    <ul v-if="downloads?.length" class="flex flex-col gap-3">
      <li
        v-for="download in downloads"
        :key="download.id"
        class="flex reveal flex-wrap items-center gap-4 panel px-5 py-4"
      >
        <span class="grid size-10 shrink-0 place-items-center rounded-full bg-black/40 text-lg text-cosmo-500">
          <AppIcon name="download" />
        </span>
        <div class="min-w-48 flex-1">
          <h2 class="font-semibold text-gold-300">{{ download.title }}</h2>
          <p v-if="download.description" class="text-xs text-aqua-300">{{ download.description }}</p>
          <p class="text-[0.7rem] text-aqua-500">
            {{ formatFileSize(download.fileSize) }} ·
            {{ t('DOWNLOADS.DOWNLOAD_COUNT', { count: formatNumber(download.downloadCount) }, download.downloadCount) }}
          </p>
        </div>
        <BaseButton :href="`/api/downloads/${download.id}`">
          <AppIcon name="download" />
          {{ t('DOWNLOADS.DOWNLOAD') }}
        </BaseButton>
      </li>
    </ul>
    <EmptyState v-else :message="t('DOWNLOADS.EMPTY')" />
  </div>
</template>
