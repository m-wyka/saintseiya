<script setup lang="ts">
const SITE_NAME = 'Saint Seiya Revolution';
const layout = useLayoutStore();
const { t } = useI18n();
const localeHead = useLocaleHead();

await callOnce('layout', layout.load);

useHead(() => ({
  htmlAttrs: { lang: localeHead.value.htmlAttrs.lang, dir: localeHead.value.htmlAttrs.dir },
  link: [...localeHead.value.link],
  meta: [...localeHead.value.meta],
  titleTemplate: (title) => (title ? `${title} · ${SITE_NAME}` : `${SITE_NAME} — ${t('LAYOUT.SITE_TAGLINE')}`),
}));
useSeoMeta({
  description: () => t('LAYOUT.SITE_DESCRIPTION'),
  ogSiteName: SITE_NAME,
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
