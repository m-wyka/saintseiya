<script setup lang="ts">
import { withLocalePrefix } from '#shared/utils/locales';
import { routes } from '#shared/utils/routes';

const SITE_NAME = 'Saint Seiya Revolution';
const layout = useLayoutStore();
const { t, locale } = useI18n();
const localeHead = useLocaleHead();

await callOnce('layout', layout.load);
watch(locale, layout.load);

useHead(() => ({
  htmlAttrs: { lang: localeHead.value.htmlAttrs.lang, dir: localeHead.value.htmlAttrs.dir },
  link: [
    ...localeHead.value.link,
    {
      rel: 'alternate',
      type: 'application/rss+xml',
      title: `${SITE_NAME} — ${t('GENERAL.NEWS')}`,
      href: withLocalePrefix(routes.newsFeed(), locale.value),
    },
  ],
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
