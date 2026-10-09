<script setup lang="ts">
import { routes } from '#shared/utils/routes';

defineProps<{
  categories: { slug: string; name: string; newsCount: number }[];
  activeSlug?: string;
}>();

const { t } = useI18n();

const CHIP_CLASSES =
  'flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition duration-200 hover:border-cosmo-500 hover:text-gold-300';
const chipState = (isActive: boolean) =>
  isActive ? 'border-cosmo-500 bg-cosmo-500/10 text-gold-300' : 'border-aqua-500/30 text-aqua-200';
</script>

<template>
  <nav class="mb-6" :aria-label="t('NEWS.CATEGORIES')">
    <ul class="flex flex-wrap gap-2">
      <li v-if="activeSlug">
        <NuxtLinkLocale :to="routes.newsList()" :class="[CHIP_CLASSES, chipState(false)]">
          {{ t('HOME.ALL_NEWS') }}
        </NuxtLinkLocale>
      </li>
      <li v-for="category in categories.filter((candidate) => candidate.newsCount > 0)" :key="category.slug">
        <NuxtLinkLocale
          :to="routes.newsCategory(category.slug)"
          :class="[CHIP_CLASSES, chipState(category.slug === activeSlug)]"
          :aria-current="category.slug === activeSlug ? 'page' : undefined"
        >
          {{ category.name }}
          <span class="text-aqua-500">{{ category.newsCount }}</span>
        </NuxtLinkLocale>
      </li>
    </ul>
  </nav>
</template>
