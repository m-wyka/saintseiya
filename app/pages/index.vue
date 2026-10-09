<script setup lang="ts">
import { routes } from '#shared/utils/routes';

const { t } = useI18n();
const { siteName } = useRuntimeConfig().public;
const { data: home } = await useFetch('/api/home');
</script>

<template>
  <div class="flex flex-col gap-10">
    <h1 class="sr-only">{{ siteName }} — {{ t('LAYOUT.SITE_TAGLINE') }}</h1>
    <div v-if="home" class="flex animate-rise flex-col gap-6">
      <NewsCenter :tabs="home.newsCenterTabs" />
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <ThreadList :title="t('HOME.LATEST_THREADS')" :threads="home.latestThreads.slice(0, 5)" />
        <ThreadList :title="t('HOME.BUSIEST_THREADS')" :threads="home.busiestThreads" shows-post-count />
      </div>
    </div>

    <section v-if="home">
      <SectionHeading :title="t('GENERAL.NEWS')" :link-to="routes.newsList()" :link-label="t('HOME.ALL_NEWS')" />
      <NewsGrid v-if="home.latestNews.length" :news="home.latestNews" />
      <EmptyState v-else :message="t('NEWS_LIST.EMPTY')" />
    </section>

    <LatestComments v-if="home" :comments="home.latestComments" />
    <LatestPhotos v-if="home" :photos="home.latestPhotos" />
    <LatestVideos v-if="home" :videos="home.latestVideos" />
  </div>
</template>
