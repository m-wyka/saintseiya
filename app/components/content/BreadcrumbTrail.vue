<script setup lang="ts">
defineProps<{ items: { title: string; to: string }[] }>();

const { t } = useI18n();
</script>

<template>
  <nav class="mb-4 text-xs text-aqua-500" :aria-label="t('CONTENT.BREADCRUMBS')">
    <ol class="flex flex-wrap items-center gap-x-1.5 gap-y-1">
      <li>
        <NuxtLinkLocale to="/" class="transition hover:text-gold-300">{{ t('GENERAL.HOME') }}</NuxtLinkLocale>
      </li>
      <li v-for="item in items" :key="item.to" class="flex items-center gap-1.5">
        <AppIcon name="chevronRight" class="text-[0.9em] text-cosmo-700" />
        <NuxtLinkLocale :to="item.to" class="transition hover:text-gold-300">{{ item.title }}</NuxtLinkLocale>
      </li>
    </ol>
  </nav>
</template>
