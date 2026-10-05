<script setup lang="ts">
defineProps<{ title: string; subtitle?: string }>();
</script>

<template>
  <header class="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-aqua-500/15 pb-4">
    <div>
      <h1 class="heading-display text-2xl text-gold-300 sm:text-3xl">{{ title }}</h1>
      <p v-if="subtitle" class="mt-1 text-sm text-aqua-300">{{ subtitle }}</p>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <slot />
    </div>
  </header>
</template>
