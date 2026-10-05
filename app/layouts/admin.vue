<script setup lang="ts">
import { canAccess } from '#shared/utils/roles';
import { ADMIN_HOME, ADMIN_NAVIGATION } from '~/utils/adminNavigation';

const { user } = useUserSession();
const route = useRoute();
const isMenuOpen = ref(false);

const visibleGroups = computed(() =>
  ADMIN_NAVIGATION.map((group) => ({
    ...group,
    items: group.items.filter((item) => canAccess(user.value, item.access)),
  })).filter((group) => group.items.length > 0),
);

const isCurrent = (to: string) =>
  to === ADMIN_HOME ? route.path === ADMIN_HOME : route.path === to || route.path.startsWith(`${to}/`);

watch(
  () => route.fullPath,
  () => (isMenuOpen.value = false),
);

useHead({ titleTemplate: (title) => (title ? `${title} · Panel SSR` : 'Panel SSR') });
useSeoMeta({ robots: 'noindex, nofollow' });
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-abyss-950 lg:flex-row">
    <header class="flex items-center justify-between gap-3 px-4 py-2 cosmo-bar lg:hidden">
      <p class="heading-display text-lg text-abyss-950">Panel SSR</p>
      <button
        type="button"
        class="cursor-pointer rounded-full p-2 text-abyss-950 hover:bg-black/15"
        aria-label="Menu panelu"
        @click="isMenuOpen = !isMenuOpen"
      >
        <AppIcon :name="isMenuOpen ? 'close' : 'menu'" class="text-xl" />
      </button>
    </header>

    <aside
      class="w-full shrink-0 flex-col gap-5 border-aqua-500/15 bg-abyss-900 p-4 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-64 lg:overflow-y-auto lg:border-r"
      :class="isMenuOpen ? 'flex' : 'hidden'"
    >
      <NuxtLink
        to="/"
        class="flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-aqua-300 transition hover:text-gold-300"
      >
        <AppIcon name="chevronLeft" />
        Wróć na stronę
      </NuxtLink>
      <p class="px-2 heading-display text-xl text-gold-300 max-lg:hidden">Panel SSR</p>
      <nav class="flex flex-col gap-4" aria-label="Panel administratora">
        <div v-for="group in visibleGroups" :key="group.title">
          <p class="mb-1 px-2 text-[0.65rem] font-semibold tracking-widest text-aqua-500 uppercase">
            {{ group.title }}
          </p>
          <ul>
            <li v-for="item in group.items" :key="item.to">
              <NuxtLink
                :to="item.to"
                class="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition duration-150"
                :class="
                  isCurrent(item.to)
                    ? 'font-semibold text-abyss-950 cosmo-bar'
                    : 'text-aqua-200 hover:bg-white/5 hover:text-gold-300'
                "
                :aria-current="isCurrent(item.to) ? 'page' : undefined"
              >
                <AppIcon :name="item.icon" />
                {{ item.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>
      </nav>
      <p v-if="user" class="mt-auto border-t border-aqua-500/15 px-2 pt-3 text-xs text-aqua-500">
        Zalogowano jako <strong class="text-aqua-200">{{ user.name }}</strong>
      </p>
    </aside>

    <main class="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
      <div class="mx-auto max-w-page">
        <slot />
      </div>
    </main>
    <AppToaster />
  </div>
</template>
