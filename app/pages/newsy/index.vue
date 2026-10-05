<script setup lang="ts">
import { routes } from '#shared/utils/routes';

const { data: categories } = await useFetch('/api/news-categories');

useSeoMeta({ title: 'Newsy' });
</script>

<template>
  <div>
    <PageHeading title="Newsy" subtitle="Aktualności ze świata Saint Seiya i z życia portalu." />
    <ul v-if="categories?.length" class="mb-6 flex flex-wrap gap-2">
      <li v-for="category in categories.filter((candidate) => candidate.newsCount > 0)" :key="category.slug">
        <NuxtLink
          :to="routes.newsCategory(category.slug)"
          class="flex items-center gap-2 rounded-full border border-aqua-500/30 px-3 py-1 text-xs text-aqua-200 transition duration-200 hover:border-cosmo-500 hover:text-gold-300"
        >
          {{ category.name }}
          <span class="text-aqua-500">{{ category.newsCount }}</span>
        </NuxtLink>
      </li>
    </ul>
    <NewsListing />
  </div>
</template>
