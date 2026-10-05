<script setup lang="ts">
const { data: downloads } = await useFetch('/api/downloads');

useSeoMeta({ title: 'Pliki do pobrania' });
</script>

<template>
  <div>
    <PageHeading title="Pliki do pobrania" />
    <ul v-if="downloads?.length" class="flex flex-col gap-3">
      <li
        v-for="download in downloads"
        :key="download.id"
        class="flex reveal flex-wrap items-center gap-4 panel px-5 py-4"
      >
        <span class="grid size-10 shrink-0 place-items-center rounded-full bg-black/40 text-lg text-cosmo-500">
          <AppIcon name="download" />
        </span>
        <div class="min-w-0 flex-1">
          <h2 class="font-semibold text-gold-300">{{ download.title }}</h2>
          <p v-if="download.description" class="text-xs text-aqua-300">{{ download.description }}</p>
          <p class="text-[0.7rem] text-aqua-500">
            {{ formatFileSize(download.fileSize) }} ·
            {{ pluralize(download.downloadCount, 'pobranie', 'pobrania', 'pobrań') }}
          </p>
        </div>
        <a
          :href="`/api/downloads/${download.id}`"
          class="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-abyss-950 transition duration-200 cosmo-bar hover:shadow-aura hover:brightness-110"
        >
          <AppIcon name="download" />
          Pobierz
        </a>
      </li>
    </ul>
    <EmptyState v-else message="Nie ma jeszcze plików do pobrania." />
  </div>
</template>
