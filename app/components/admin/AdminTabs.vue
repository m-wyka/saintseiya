<script setup lang="ts">
import type { AdminTab } from '~/utils/adminTabs';

defineProps<{ label: string; tabs: AdminTab[] }>();

const sitePath = useCurrentSitePath();
const { t } = useI18n();
</script>

<template>
  <nav class="mb-4 flex flex-wrap gap-2" :aria-label="label">
    <NuxtLinkLocale
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      class="rounded-full border px-3 py-1 text-xs font-semibold transition duration-150"
      :class="
        sitePath === tab.to
          ? 'border-transparent cosmo-bar text-abyss-950'
          : 'border-aqua-500/30 text-aqua-200 hover:border-cosmo-500 hover:text-gold-300'
      "
      :aria-current="sitePath === tab.to ? 'page' : undefined"
    >
      {{ t(tab.labelKey) }}
    </NuxtLinkLocale>
  </nav>
</template>
