<script setup lang="ts">
const props = defineProps<{ page: number; pageCount: number }>();

const NEIGHBOUR_COUNT = 2;
const route = useRoute();

const visiblePages = computed(() => {
  const pages = new Set([1, props.pageCount]);
  for (let offset = -NEIGHBOUR_COUNT; offset <= NEIGHBOUR_COUNT; offset += 1) {
    const candidate = props.page + offset;
    if (candidate >= 1 && candidate <= props.pageCount) {
      pages.add(candidate);
    }
  }
  return [...pages].sort((first, second) => first - second);
});

const hasGapBefore = (index: number) => index > 0 && visiblePages.value[index]! - visiblePages.value[index - 1]! > 1;
const linkTo = (page: number) => ({ path: route.path, query: { ...route.query, page: page > 1 ? page : undefined } });
</script>

<template>
  <nav v-if="pageCount > 1" class="mt-8 flex flex-wrap items-center justify-center gap-1.5" aria-label="Stronicowanie">
    <template v-for="(candidate, index) in visiblePages" :key="candidate">
      <span v-if="hasGapBefore(index)" class="px-1 text-aqua-500" aria-hidden="true">…</span>
      <NuxtLink
        :to="linkTo(candidate)"
        class="grid h-9 min-w-9 place-items-center rounded-full px-2 text-sm font-semibold transition duration-200"
        :class="
          candidate === page
            ? 'text-abyss-950 cosmo-bar'
            : 'border border-aqua-500/30 text-aqua-200 hover:border-cosmo-500 hover:text-gold-300'
        "
        :aria-current="candidate === page ? 'page' : undefined"
        :aria-label="`Strona ${candidate}`"
      >
        {{ candidate }}
      </NuxtLink>
    </template>
  </nav>
</template>
