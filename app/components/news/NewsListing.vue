<script setup lang="ts">
const props = defineProps<{ categorySlug?: string; tagSlug?: string }>();

const route = useRoute();
const page = computed(() => Number(route.query.page) || 1);

const { data: listing, error } = await useFetch('/api/news', {
  query: computed(() => ({ page: page.value, category: props.categorySlug, tag: props.tagSlug })),
});

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode ?? 500,
    statusMessage: 'Nie udało się wczytać newsów',
    fatal: true,
  });
}
</script>

<template>
  <div v-if="listing">
    <div v-if="listing.items.length" class="flex flex-col gap-6">
      <NewsCard v-for="news in listing.items" :key="news.slug" :news="news" />
    </div>
    <EmptyState v-else message="Nie ma jeszcze żadnych newsów w tym miejscu." />
    <PaginationNav :page="listing.page" :page-count="listing.pageCount" />
  </div>
</template>
