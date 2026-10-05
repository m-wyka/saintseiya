<script setup lang="ts">
import { routes } from '#shared/utils/routes';

const { t } = useI18n();
const routeSlug = useRouteParam('slug');
const { data: categories } = await useFetch('/api/news-categories');
const category = computed(() => categories.value?.find((candidate) => candidate.slug === routeSlug.value));

if (!category.value) {
  throw createError({ statusCode: 404, statusMessage: t('NEWS.CATEGORY_NOT_FOUND'), fatal: true });
}

useSeoMeta({ title: () => t('NEWS.CATEGORY_SEO_TITLE', { name: category.value?.name ?? '' }) });
</script>

<template>
  <div v-if="category">
    <BreadcrumbTrail :items="[{ title: t('GENERAL.NEWS'), to: routes.newsList() }]" />
    <PageHeading
      :title="category.name"
      :subtitle="t('NEWS.NEWS_COUNT', { count: formatNumber(category.newsCount) }, category.newsCount)"
    />
    <NewsListing :category-slug="category.slug" />
  </div>
</template>
