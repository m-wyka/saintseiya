<script setup lang="ts">
defineProps<{ items: { title: string; to: string }[] }>();
</script>

<template>
  <nav class="mb-4 text-xs text-aqua-500" aria-label="Ścieżka nawigacji">
    <ol class="flex flex-wrap items-center gap-x-1.5 gap-y-1">
      <li>
        <NuxtLink to="/" class="transition hover:text-gold-300">Główna</NuxtLink>
      </li>
      <li v-for="item in items" :key="item.to" class="flex items-center gap-1.5">
        <AppIcon name="chevronRight" class="text-[0.9em] text-cosmo-700" />
        <NuxtLink :to="item.to" class="transition hover:text-gold-300">{{ item.title }}</NuxtLink>
      </li>
    </ol>
  </nav>
</template>
