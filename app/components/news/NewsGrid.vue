<script setup lang="ts">
import type { InternalApi } from 'nitropack';

type NewsSummary = InternalApi['/api/news']['get']['items'][number];

const props = defineProps<{ news: NewsSummary[]; headingTag?: 'h2' | 'h3' }>();

// The lead is a 2×2 block in three columns. In two columns it takes a whole row only when
// that leaves an even number of tiles under it, so the last row is never half empty.
const leadSpan = computed(() =>
  props.news.length % 2 === 1 ? 'only:col-span-full @xl:col-span-2 @4xl:row-span-2' : '@4xl:col-span-2 @4xl:row-span-2',
);
</script>

<template>
  <div class="@container">
    <div class="grid gap-5 @xl:grid-cols-2 @4xl:grid-cols-3">
      <NewsCard
        v-for="(item, index) in news"
        :key="item.slug"
        :news="item"
        :featured="index === 0"
        :heading-tag="headingTag"
        :class="{ [leadSpan]: index === 0 }"
      />
    </div>
  </div>
</template>
