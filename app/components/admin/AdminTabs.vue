<script setup lang="ts">
import type { AdminTab } from '~/utils/adminTabs';

defineProps<{ label: string; tabs: AdminTab[] }>();

const route = useRoute();
</script>

<template>
  <nav class="mb-4 flex flex-wrap gap-2" :aria-label="label">
    <NuxtLink
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      class="rounded-full border px-3 py-1 text-xs font-semibold transition duration-150"
      :class="
        route.path === tab.to
          ? 'border-transparent text-abyss-950 cosmo-bar'
          : 'border-aqua-500/30 text-aqua-200 hover:border-cosmo-500 hover:text-gold-300'
      "
      :aria-current="route.path === tab.to ? 'page' : undefined"
    >
      {{ tab.label }}
    </NuxtLink>
  </nav>
</template>
