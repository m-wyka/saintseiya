<script setup lang="ts">
defineProps<{ title: string; linkTo?: string; linkLabel?: string }>();

const { t } = useI18n();
</script>

<template>
  <div class="mb-4 flex items-end justify-between gap-4">
    <h2 class="flex items-center gap-3 heading-display text-xl text-gold-300">
      <span class="h-5 w-1 rounded-full cosmo-bar" aria-hidden="true" />
      {{ title }}
    </h2>
    <NuxtLinkLocale
      v-if="linkTo"
      :to="linkTo"
      class="group flex items-center gap-1 text-xs font-semibold tracking-wide text-cosmo-400 uppercase transition hover:text-gold-300"
    >
      {{ linkLabel ?? t('CONTENT.SEE_ALL') }}
      <AppIcon name="chevronRight" class="transition duration-200 group-hover:translate-x-0.5" />
    </NuxtLinkLocale>
  </div>
</template>
