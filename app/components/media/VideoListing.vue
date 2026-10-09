<script setup lang="ts">
import { routes } from '#shared/utils/routes';

const props = defineProps<{ categorySlug?: string }>();

const { t } = useI18n();
const page = usePageQuery();
const redirectPastLastPage = useLastPageRedirect();
const { data, error } = await useFetch('/api/videos', {
  query: computed(() => ({ page: page.value, category: props.categorySlug })),
});

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode ?? 500,
    statusMessage: t('VIDEO_LIST.LOAD_FAILED'),
    fatal: true,
  });
}

await redirectPastLastPage(data.value?.videos);

const currentCategory = computed(() => data.value?.categories.find((category) => category.slug === props.categorySlug));
const listedCategories = computed(
  () =>
    data.value?.categories.filter((category) => category.videoCount > 0 || category.slug === props.categorySlug) ?? [],
);

if (props.categorySlug && !currentCategory.value) {
  throw createError({ statusCode: 404, statusMessage: t('VIDEO_LIST.CATEGORY_NOT_FOUND'), fatal: true });
}

useSeoMeta({
  title: () =>
    currentCategory.value
      ? t('VIDEO_LIST.CATEGORY_TITLE', { name: currentCategory.value.name })
      : t('VIDEO_LIST.TITLE'),
});
</script>

<template>
  <div v-if="data">
    <BreadcrumbTrail v-if="currentCategory" :items="[{ title: t('GENERAL.VIDEO'), to: routes.videos() }]" />
    <PageHeading
      :title="currentCategory?.name ?? t('VIDEO_LIST.TITLE')"
      :subtitle="currentCategory?.description ?? t('VIDEO_LIST.SUBTITLE')"
    />
    <ul class="mb-6 flex flex-wrap gap-2">
      <li>
        <NuxtLinkLocale
          :to="routes.videos()"
          class="rounded-full border px-3 py-1 text-xs transition duration-200"
          :class="
            categorySlug
              ? 'border-aqua-500/30 text-aqua-200 hover:border-cosmo-500 hover:text-gold-300'
              : 'border-transparent cosmo-bar font-semibold text-abyss-950'
          "
        >
          {{ t('GENERAL.ALL') }}
        </NuxtLinkLocale>
      </li>
      <li v-for="category in listedCategories" :key="category.slug">
        <NuxtLinkLocale
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
        </NuxtLinkLocale>
      </li>
    </ul>
    <div v-if="data.videos.items.length" class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      <VideoCard v-for="video in data.videos.items" :key="video.id" :video="video" />
    </div>
    <EmptyState v-else :message="t('VIDEO_LIST.EMPTY')" />
    <PaginationNav :page="data.videos.page" :page-count="data.videos.pageCount" />
  </div>
</template>
