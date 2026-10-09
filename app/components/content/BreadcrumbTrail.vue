<script setup lang="ts">
defineProps<{ items: { title: string; to: string }[] }>();

const { t } = useI18n();
</script>

<template>
  <nav class="mb-2 text-xs text-aqua-500" :aria-label="t('CONTENT.BREADCRUMBS')">
    <!-- The arrow closes the item before it, so a wrapped line never starts with a lone arrow. -->
    <ol class="flex flex-wrap items-center gap-x-1.5">
      <li class="flex items-center gap-1.5">
        <NuxtLinkLocale to="/" class="py-2 transition hover:text-gold-300">{{ t('GENERAL.HOME') }}</NuxtLinkLocale>
        <AppIcon v-if="items.length" name="chevronRight" class="text-[0.9em] text-cosmo-700" />
      </li>
      <li v-for="(item, index) in items" :key="item.to" class="flex items-center gap-1.5">
        <NuxtLinkLocale :to="item.to" class="py-2 transition hover:text-gold-300">{{ item.title }}</NuxtLinkLocale>
        <AppIcon v-if="index < items.length - 1" name="chevronRight" class="text-[0.9em] text-cosmo-700" />
      </li>
    </ol>
  </nav>
</template>
