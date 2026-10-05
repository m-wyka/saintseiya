<script setup lang="ts">
import { routes } from '#shared/utils/routes';

const props = defineProps<{ categorySlug?: string }>();

const route = useRoute();
const page = computed(() => Number(route.query.page) || 1);
const { data, error } = await useFetch('/api/videos', {
  query: computed(() => ({ page: page.value, category: props.categorySlug })),
});

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode ?? 500,
    statusMessage: 'Nie udało się wczytać filmów',
    fatal: true,
  });
}

const currentCategory = computed(() => data.value?.categories.find((category) => category.slug === props.categorySlug));

if (props.categorySlug && !currentCategory.value) {
  throw createError({ statusCode: 404, statusMessage: 'Nie znaleziono kategorii', fatal: true });
}

useSeoMeta({ title: () => (currentCategory.value ? `${currentCategory.value.name} – Video` : 'Galeria video') });
</script>

<template>
  <div v-if="data">
    <BreadcrumbTrail v-if="currentCategory" :items="[{ title: 'Video', to: routes.videos() }]" />
    <PageHeading
      :title="currentCategory?.name ?? 'Galeria video'"
      :subtitle="currentCategory?.description ?? 'AMV, openingi, zwiastuny i relacje ze świata Saint Seiya.'"
    />
    <ul class="mb-6 flex flex-wrap gap-2">
      <li>
        <NuxtLink
          :to="routes.videos()"
          class="rounded-full border px-3 py-1 text-xs transition duration-200"
          :class="
            categorySlug
              ? 'border-aqua-500/30 text-aqua-200 hover:border-cosmo-500 hover:text-gold-300'
              : 'border-transparent cosmo-bar font-semibold text-abyss-950'
          "
        >
          Wszystkie
        </NuxtLink>
      </li>
      <li v-for="category in data.categories" :key="category.slug">
        <NuxtLink
          :to="routes.videoCategory(category.slug)"
          class="flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition duration-200"
          :class="
            category.slug === categorySlug
              ? 'border-transparent cosmo-bar font-semibold text-abyss-950'
              : 'border-aqua-500/30 text-aqua-200 hover:border-cosmo-500 hover:text-gold-300'
          "
        >
          {{ category.name }}
          <span class="opacity-70">{{ category.videoCount }}</span>
        </NuxtLink>
      </li>
    </ul>
    <div v-if="data.videos.items.length" class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      <VideoCard v-for="video in data.videos.items" :key="video.id" :video="video" />
    </div>
    <EmptyState v-else message="W tej kategorii nie ma jeszcze filmów." />
    <PaginationNav :page="data.videos.page" :page-count="data.videos.pageCount" />
  </div>
</template>
