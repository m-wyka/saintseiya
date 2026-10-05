<script setup lang="ts">
import { routes } from '#shared/utils/routes';

const route = useRoute('mapy-slug');
const { data: map, error } = await useFetch(() => `/api/maps/${route.params.slug}`);

if (error.value || !map.value) {
  throw createError({ statusCode: error.value?.statusCode ?? 404, statusMessage: 'Nie znaleziono mapy', fatal: true });
}

useSeoMeta({ title: () => `${map.value?.title ?? ''} – Mapy` });
</script>

<template>
  <div v-if="map">
    <BreadcrumbTrail :items="[{ title: 'Mapy', to: routes.maps() }]" />
    <PageHeading :title="map.title" :subtitle="map.description" />
    <InteractiveMap :map="map" />
  </div>
</template>
