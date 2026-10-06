<script setup lang="ts">
import { routes } from '#shared/utils/routes';

const { t } = useI18n();
const { data: home } = await useFetch('/api/home');
</script>

<template>
  <div class="flex flex-col gap-10">
    <div v-if="home" class="grid animate-rise grid-cols-1 gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <NewsCenter :tabs="home.newsCenterTabs" />
      <div class="flex flex-col gap-6">
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
