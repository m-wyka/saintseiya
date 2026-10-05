<script setup lang="ts">
import { MAIN_NAVIGATION } from '~/utils/mainNavigation';

const ui = useUiStore();
const { t } = useI18n();
const route = useRoute();

watch(() => route.fullPath, ui.closeMenu);

const closeOnEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    ui.closeMenu();
  }
};

onMounted(() => window.addEventListener('keydown', closeOnEscape));
onBeforeUnmount(() => window.removeEventListener('keydown', closeOnEscape));

useHead({ bodyAttrs: { class: computed(() => (ui.isMenuOpen ? 'overflow-hidden' : '')) } });
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-cosmo"
    enter-from-class="opacity-0"
    leave-active-class="transition duration-200"
    leave-to-class="opacity-0"
  >
    <div
      v-if="ui.isMenuOpen"
      class="fixed inset-0 z-50 lg:hidden"
      role="dialog"
      aria-modal="true"
      :aria-label="t('LAYOUT.MENU')"
    >
      <button
        type="button"
        class="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
        :aria-label="t('SIDE_NAV.CLOSE_MENU')"
        @click="ui.closeMenu"
      />
      <div
        class="absolute inset-y-0 left-0 flex w-[min(22rem,88vw)] animate-rise flex-col gap-4 overflow-y-auto bg-abyss-950 p-4 shadow-panel"
      >
        <div class="flex items-center justify-between">
          <p class="heading-display text-xl text-gold-300">{{ t('LAYOUT.MENU') }}</p>
          <button
            type="button"
            class="cursor-pointer rounded-full p-2 text-aqua-300 hover:bg-white/10 hover:text-gold-300"
            :aria-label="t('SIDE_NAV.CLOSE_MENU')"
            @click="ui.closeMenu"
          >
            <AppIcon name="close" class="text-xl" />
          </button>
        </div>
        <ul class="grid grid-cols-2 gap-2">
          <li v-for="item in MAIN_NAVIGATION" :key="item.to">
            <NuxtLinkLocale
              :to="item.to"
              class="flex items-center gap-2 rounded-lg border border-cosmo-500/30 px-3 py-2 font-display text-sm font-semibold tracking-wider text-cosmo-400 uppercase hover:bg-cosmo-500/10"
            >
              <AppIcon :name="item.icon" />
              {{ t(item.labelKey) }}
            </NuxtLinkLocale>
          </li>
        </ul>
        <NavigationSections />
      </div>
    </div>
  </Transition>
</template>
