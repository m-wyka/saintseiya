<script setup lang="ts">
import { routes } from '#shared/utils/routes';

const route = useRoute('newsy-kategoria-slug');
const { data: categories } = await useFetch('/api/news-categories');
const category = computed(() => categories.value?.find((candidate) => candidate.slug === route.params.slug));

if (!category.value) {
  throw createError({ statusCode: 404, statusMessage: 'Nie znaleziono kategorii', fatal: true });
}

useSeoMeta({ title: () => `Newsy: ${category.value?.name ?? ''}` });
</script>

<template>
  <div v-if="category">
    <BreadcrumbTrail :items="[{ title: 'Newsy', to: routes.newsList() }]" />
    <PageHeading :title="category.name" :subtitle="pluralize(category.newsCount, 'news', 'newsy', 'newsów')" />
    <NewsListing :category-slug="category.slug" />
  </div>
</template>
