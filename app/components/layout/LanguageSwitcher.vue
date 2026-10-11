<script setup lang="ts">
const { locale, locales, t } = useI18n();
const switchLocalePath = useSwitchLocalePath();

const pathWithoutHash = (path: string) => path.split('#')[0];
</script>

<template>
  <div
    class="mr-2 flex h-8 shrink-0 items-center self-center rounded-full border border-white/10 bg-white/5 p-0.5 text-xs"
    role="group"
    :aria-label="t('GENERAL.LANGUAGE')"
  >
    <NuxtLink
      v-for="option in locales"
      :key="option.code"
      :to="pathWithoutHash(switchLocalePath(option.code))"
      :lang="option.code"
      :title="option.name"
      class="flex h-full items-center rounded-full px-2.5 font-semibold uppercase transition duration-200 ease-cosmo"
      :class="
        option.code === locale
          ? 'bg-white/10 text-gold-300 max-sm:hidden'
          : 'text-aqua-300 hover:bg-white/10 hover:text-gold-300'
      "
      :aria-current="option.code === locale ? 'true' : undefined"
    >
      {{ option.code }}
    </NuxtLink>
  </div>
</template>
