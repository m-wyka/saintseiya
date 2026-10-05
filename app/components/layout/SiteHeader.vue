<script setup lang="ts">
import { MAIN_NAVIGATION } from '~/utils/mainNavigation';

const ui = useUiStore();
const sitePath = useCurrentSitePath();
const { t } = useI18n();

const isCurrent = (item: (typeof MAIN_NAVIGATION)[number]) =>
  item.matchesExactly
    ? sitePath.value === item.to
    : sitePath.value === item.to || sitePath.value.startsWith(`${item.to}/`);
</script>

<template>
  <header class="relative">
    <NuxtLinkLocale to="/" class="mx-auto block max-w-page lg:px-4" :aria-label="t('LAYOUT.HOME_LINK')">
      <img
        src="/theme/hero.jpg"
        :alt="t('LAYOUT.HERO_ALT')"
        width="1280"
        height="172"
        class="h-28 w-full object-cover object-center sm:h-36 lg:h-43"
        fetchpriority="high"
      />
    </NuxtLinkLocale>
  </header>

  <nav class="sticky top-0 z-40 mx-auto w-full max-w-page lg:px-4" :aria-label="t('LAYOUT.MAIN_MENU')">
    <div
      class="flex items-stretch rounded-b-xl border-y border-white/10 bg-abyss-950/55 p-2 shadow-[0_12px_32px_-16px_rgb(0_0_0/0.9)] backdrop-blur-xl backdrop-saturate-150 lg:border-x"
    >
      <button
        type="button"
        class="flex cursor-pointer items-center gap-2 p-3 font-display text-xs font-semibold tracking-widest text-gold-300 uppercase lg:hidden"
        :aria-label="t('LAYOUT.OPEN_MENU')"
        @click="ui.openMenu"
      >
        <AppIcon name="menu" class="text-base" />
        {{ t('LAYOUT.MENU') }}
      </button>
      <ul class="flex min-w-0 flex-1 items-stretch gap-x-1 overflow-x-auto">
        <li
          v-for="item in MAIN_NAVIGATION"
          :key="item.to"
          class="flex"
          :class="{ 'max-lg:hidden': !item.matchesExactly }"
        >
          <NuxtLinkLocale
            :to="item.to"
            class="relative flex items-center gap-2 rounded-lg p-3 font-display text-xs font-semibold tracking-widest whitespace-nowrap uppercase transition duration-200"
            :class="
              isCurrent(item)
                ? 'bg-white/5 text-gold-300 shadow-[inset_0_-1px_0_var(--color-cosmo-500)]'
                : 'text-aqua-200 hover:bg-white/5 hover:text-gold-300'
            "
            :aria-current="isCurrent(item) ? 'page' : undefined"
          >
            <AppIcon :name="item.icon" />
            {{ t(item.labelKey) }}
          </NuxtLinkLocale>
        </li>
      </ul>
      <SearchTrigger />
      <UserMenu />
    </div>
  </nav>
</template>
