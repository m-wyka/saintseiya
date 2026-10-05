<script setup lang="ts">
const LOGIN_FAILED_FLAG = 'blad';

const route = useRoute();
const toasts = useToastStore();
const { t } = useI18n();

onMounted(() => {
  if (route.query.logowanie === LOGIN_FAILED_FLAG) {
    toasts.error(t('LAYOUT.GOOGLE_SIGN_IN_FAILED'));
    navigateTo({ query: { ...route.query, logowanie: undefined } }, { replace: true });
  }
});
</script>

<template>
  <div class="relative isolate flex min-h-dvh flex-col">
    <div class="starfield" aria-hidden="true" />
    <a
      href="#tresc"
      class="sr-only z-50 rounded-full bg-cosmo-500 px-4 py-2 font-semibold text-abyss-950 focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
    >
      {{ t('LAYOUT.SKIP_TO_CONTENT') }}
    </a>
    <SiteHeader />
    <div class="mx-auto grid w-full max-w-page flex-1 gap-8 px-4 py-8 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside class="max-lg:hidden" :aria-label="t('LAYOUT.SECTION_NAVIGATION')">
        <NavigationSections />
      </aside>
      <main id="tresc" class="min-w-0">
        <slot />
      </main>
    </div>
    <SiteFooter />
    <MobileMenu />
    <AppToaster />
  </div>
</template>
