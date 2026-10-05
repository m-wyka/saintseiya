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
        <span>
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

    <NuxtLink
      to="/"
      class="group relative mx-auto block max-w-page overflow-hidden"
      aria-label="Saint Seiya Revolution — strona główna"
    >
      <img
        src="/theme/hero.jpg"
        alt="Saint Seiya Revolution — Rycerze Zodiaku Polska"
        width="1280"
        height="172"
        class="h-28 w-full object-cover object-center transition duration-700 ease-cosmo group-hover:scale-[1.02] sm:h-36 lg:h-43"
        fetchpriority="high"
      />
      <span class="pointer-events-none absolute inset-0 cosmo-sheen opacity-30 mix-blend-overlay" aria-hidden="true" />
      <span
        class="pointer-events-none absolute inset-0 bg-linear-to-r from-void via-transparent to-void opacity-60 lg:opacity-0"
        aria-hidden="true"
      />
    </NuxtLink>
  </header>

  <nav class="sticky top-0 z-40 shadow-[0_8px_24px_-12px_rgb(255_122_1/0.7)] cosmo-bar" aria-label="Menu główne">
    <div class="mx-auto flex max-w-page items-stretch px-2">
      <button
        type="button"
        class="flex cursor-pointer items-center gap-2 px-3 py-2.5 font-display text-sm font-semibold tracking-widest text-abyss-950 uppercase lg:hidden"
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
                ? 'bg-abyss-950 text-gold-300 shadow-[inset_0_-2px_0_var(--color-cosmo-500)]'
                : 'text-abyss-950 hover:bg-black/15'
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
