<script setup lang="ts">
import { routes } from '#shared/utils/routes';

const { data: home } = await useFetch('/api/home');
</script>

<template>
  <div class="flex flex-col gap-10">
    <div v-if="home" class="grid animate-rise grid-cols-1 gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <NewsCenter :tabs="home.newsCenterTabs" />
      <div class="flex flex-col gap-6">
        <ThreadList title="Najnowsze tematy" :threads="home.latestThreads.slice(0, 5)" />
        <ThreadList title="Najciekawsze tematy" :threads="home.busiestThreads" shows-post-count />
      </div>
    </div>

    <section>
      <SectionHeading title="Newsy" :link-to="routes.newsList()" link-label="Wszystkie newsy" />
      <NewsListing />
    </section>

    <LatestComments v-if="home" :comments="home.latestComments" />
    <LatestMedia v-if="home" :photos="home.latestPhotos" :videos="home.latestVideos" />
  </div>
</template>
