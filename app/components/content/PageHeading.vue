<script setup lang="ts">
defineProps<{ title: string; subtitle?: string }>();
</script>

<template>
  <header class="mb-6 flex animate-rise flex-col gap-1">
    <h1 class="heading-display text-3xl/tight text-gold-300 sm:text-4xl">{{ title }}</h1>
    <p v-if="subtitle" class="text-sm text-aqua-300">{{ subtitle }}</p>
    <span class="mt-2 h-px w-full bg-linear-to-r from-cosmo-500 via-cosmo-500/30 to-transparent" aria-hidden="true" />
  </header>
</template>
