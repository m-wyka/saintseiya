<script setup lang="ts">
defineProps<{ title: string; linkTo?: string; linkLabel?: string }>();

const { t } = useI18n();
</script>

<template>
  <div class="mb-5">
    <div class="flex items-end justify-between gap-4">
      <h2 class="heading-display text-2xl/tight font-bold text-gold-300">{{ title }}</h2>
      <NuxtLinkLocale
        v-if="linkTo"
        :to="linkTo"
        class="group mb-1 flex shrink-0 items-center gap-1 text-xs font-semibold tracking-wide text-cosmo-400 uppercase transition hover:text-gold-300"
      >
        {{ linkLabel ?? t('CONTENT.SEE_ALL') }}
        <AppIcon name="chevronRight" class="transition duration-200 group-hover:translate-x-0.5" />
      </NuxtLinkLocale>
    </div>
    <div class="mt-1.5 flex items-center" aria-hidden="true">
      <svg viewBox="0 0 24 24" class="size-4 shrink-0 meteor-head">
        <path d="M12 0C12 9 15 12 24 12C15 12 12 15 12 24C12 15 9 12 0 12C9 12 12 9 12 0Z" />
      </svg>
      <span class="-ml-1.5 meteor-trail flex-1" />
    </div>
  </div>
</template>
