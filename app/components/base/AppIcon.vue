<script setup lang="ts">
import { ICON_PATHS } from '~/utils/icons';
import type { IconName } from '~/utils/icons';

defineProps<{ name: IconName }>();
</script>

<template>
  <svg
    class="inline-block size-[1.15em] shrink-0"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="ICON_PATHS[name]" />
  </svg>
</template>
