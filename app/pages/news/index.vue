<script setup lang="ts">
const { t } = useI18n();
const { data: categories } = await useFetch('/api/news-categories');

useSeoMeta({ title: () => t('GENERAL.NEWS') });
</script>

<template>
  <div>
    <PageHeading :title="t('GENERAL.NEWS')" :subtitle="t('NEWS.SUBTITLE')" />
    <NewsCategoryBar v-if="categories?.length" :categories="categories" />
    <NewsListing />
  </div>
</template>
