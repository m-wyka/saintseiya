<script setup lang="ts">
import { MAIN_NAVIGATION } from '~/utils/mainNavigation';

const layout = useLayoutStore();
const ui = useUiStore();
const route = useRoute();

const isCurrent = (item: (typeof MAIN_NAVIGATION)[number]) =>
  item.matchesExactly ? route.path === item.to : route.path === item.to || route.path.startsWith(`${item.to}/`);
</script>

<template>
  <header class="relative">
    <div class="mx-auto flex max-w-page items-center justify-between gap-4 px-4 py-2 text-xs text-aqua-300">
      <p v-if="layout.statistics" class="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span v-if="layout.statistics.memberCount">
          Rycerzy: <strong class="text-gold-300">{{ formatNumber(layout.statistics.memberCount) }}</strong>
        </span>
        <span class="max-sm:hidden">
          Postów na forum: <strong class="text-gold-300">{{ formatNumber(layout.statistics.postCount) }}</strong>
        </span>
        <span class="max-md:hidden">
          Komentarzy: <strong class="text-gold-300">{{ formatNumber(layout.statistics.commentCount) }}</strong>
        </span>
      </p>
      <UserMenu />
    </div>

    <NuxtLink to="/" class="mx-auto block max-w-page lg:px-4" aria-label="Saint Seiya Revolution — strona główna">
      <img
        src="/theme/hero.jpg"
        alt="Saint Seiya Revolution — Rycerze Zodiaku Polska"
        width="1280"
        height="172"
        class="h-28 w-full object-cover object-center sm:h-36 lg:h-43"
        fetchpriority="high"
      />
    </NuxtLink>
  </header>

  <nav
    class="sticky top-0 z-40 border-y border-white/10 bg-abyss-950/55 shadow-[0_12px_32px_-16px_rgb(0_0_0/0.9)] backdrop-blur-xl backdrop-saturate-150"
    aria-label="Menu główne"
  >
    <div class="mx-auto flex max-w-page items-stretch px-2 lg:px-4">
      <button
        type="button"
        class="flex cursor-pointer items-center gap-2 px-3 py-2.5 font-display text-sm font-semibold tracking-widest text-gold-300 uppercase lg:hidden"
        aria-label="Otwórz menu"
        @click="ui.openMenu"
      >
        <AppIcon name="menu" class="text-lg" />
        Menu
      </button>
      <ul class="flex flex-1 items-stretch overflow-x-auto max-lg:justify-end">
        <li
          v-for="item in MAIN_NAVIGATION"
          :key="item.to"
          class="flex"
          :class="{ 'max-lg:hidden': !item.matchesExactly && item.icon !== 'search' }"
        >
          <NuxtLink
            :to="item.to"
            class="relative flex items-center gap-2 px-4 py-2.5 font-display text-sm font-semibold tracking-widest whitespace-nowrap uppercase transition duration-200"
            :class="
              isCurrent(item)
                ? 'bg-white/5 text-gold-300 shadow-[inset_0_-2px_0_var(--color-cosmo-500)]'
                : 'text-aqua-200 hover:bg-white/5 hover:text-gold-300'
            "
            :aria-current="isCurrent(item) ? 'page' : undefined"
          >
            <AppIcon :name="item.icon" />
            <span :class="{ 'max-sm:sr-only': item.icon === 'search' }">{{ item.label }}</span>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </nav>
</template>
