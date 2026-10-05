<script setup lang="ts">
const props = defineProps<{ categorySlug?: string; tagSlug?: string }>();

const { t } = useI18n();
const page = usePageQuery();
const redirectPastLastPage = useLastPageRedirect();

const { data: listing, error } = await useFetch('/api/news', {
  query: computed(() => ({ page: page.value, category: props.categorySlug, tag: props.tagSlug })),
});

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode ?? 500,
    statusMessage: t('NEWS_LIST.LOAD_FAILED'),
    fatal: true,
  });
}

await redirectPastLastPage(listing.value);
</script>

<template>
  <div v-if="listing">
    <div v-if="listing.items.length" class="flex flex-col gap-6">
      <NewsCard v-for="news in listing.items" :key="news.slug" :news="news" />
    </div>
    <EmptyState v-else :message="t('NEWS_LIST.EMPTY')" />
    <PaginationNav :page="listing.page" :page-count="listing.pageCount" />
  </div>
</template>
