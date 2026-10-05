<script setup lang="ts">
const SITE_NAME = 'Saint Seiya Revolution';
const layout = useLayoutStore();

await callOnce('layout', layout.load);

useHead({
  titleTemplate: (title) => (title ? `${title} · ${SITE_NAME}` : `${SITE_NAME} — Rycerze Zodiaku Polska`),
});
useSeoMeta({
  description: 'Saint Seiya Revolution — największa polska strona o Saint Seiya, czyli Rycerzach Zodiaku.',
  ogSiteName: SITE_NAME,
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
