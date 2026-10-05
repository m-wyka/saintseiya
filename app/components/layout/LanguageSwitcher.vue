<script setup lang="ts">
const { locale, locales, t } = useI18n();
const switchLocalePath = useSwitchLocalePath();

const pathWithoutHash = (path: string) => path.split('#')[0];
</script>

<template>
  <nav class="flex items-center gap-1" :aria-label="t('GENERAL.LANGUAGE')">
    <NuxtLink
      v-for="option in locales"
      :key="option.code"
      :to="pathWithoutHash(switchLocalePath(option.code))"
      :lang="option.code"
      :title="option.name"
      class="rounded-full px-2 py-1 font-semibold uppercase transition duration-150"
      :class="
        option.code === locale ? 'bg-white/10 text-gold-300' : 'text-aqua-300 hover:bg-white/5 hover:text-gold-300'
      "
      :aria-current="option.code === locale ? 'true' : undefined"
    >
      {{ option.code }}
    </NuxtLink>
  </nav>
</template>
