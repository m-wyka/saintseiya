<script setup lang="ts">
import { CONTENT_LOCALES } from '#shared/utils/locales';

const contentLocale = useContentLocaleStore();
const { t } = useI18n();
</script>

<template>
  <div class="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 panel px-4 py-2 text-xs text-aqua-300">
    <div class="flex items-center gap-2" role="group" :aria-label="t('ADMIN_UI.CONTENT_LANGUAGE')">
      <span class="font-semibold tracking-wide uppercase">{{ t('ADMIN_UI.CONTENT_LANGUAGE') }}</span>
      <button
        v-for="code in CONTENT_LOCALES"
        :key="code"
        type="button"
        class="cursor-pointer rounded-full border px-3 py-1 font-semibold uppercase transition duration-150"
        :class="
          code === contentLocale.editedLocale
            ? 'border-transparent cosmo-bar text-abyss-950'
            : 'border-aqua-500/30 text-aqua-200 hover:border-cosmo-500 hover:text-gold-300'
        "
        :aria-pressed="code === contentLocale.editedLocale"
        @click="contentLocale.editedLocale = code"
      >
        {{ code }}
      </button>
    </div>
    <p v-if="contentLocale.isTranslating">{{ t('ADMIN_UI.TRANSLATING_HINT') }}</p>
  </div>
</template>
