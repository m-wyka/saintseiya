<script setup lang="ts">
const APPLE_PLATFORM = /Mac|iPhone|iPad|iPod/;

const ui = useUiStore();
const { t } = useI18n();

const isApplePlatform = useState('isApplePlatform', () =>
  APPLE_PLATFORM.test(import.meta.server ? (useRequestHeader('user-agent') ?? '') : navigator.userAgent),
);
</script>

<template>
  <button
    type="button"
    class="group mx-2 flex h-8 shrink-0 cursor-pointer items-center gap-2 self-center rounded-full border border-white/10 bg-white/5 text-xs text-aqua-300 transition duration-200 ease-cosmo select-none hover:border-cosmo-500/50 hover:bg-white/10 hover:text-gold-300 active:scale-[0.97] max-sm:w-8 max-sm:justify-center sm:px-3 lg:pr-1.5"
    aria-haspopup="dialog"
    aria-keyshortcuts="Control+K Meta+K /"
    @click="ui.openSearch"
  >
    <AppIcon name="search" />
    <span class="text-left max-sm:sr-only lg:w-24">{{ t('GENERAL.SEARCH') }}</span>
    <kbd
      class="rounded-full border border-white/10 bg-abyss-950/70 px-2 py-0.5 font-sans text-[0.65rem] font-semibold tracking-wide text-aqua-300 transition-colors duration-200 group-hover:border-cosmo-500/40 group-hover:text-gold-300 max-lg:hidden"
      aria-hidden="true"
    >
      {{ isApplePlatform ? '⌘K' : 'Ctrl K' }}
    </kbd>
  </button>
</template>
