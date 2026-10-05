<script setup lang="ts">
import { routes } from '#shared/utils/routes';

const { t } = useI18n();
const routeSlug = useRouteParam('slug');
const { data: map, error } = await useFetch(() => `/api/maps/${routeSlug.value}`);

if (error.value || !map.value) {
  throw createError({ statusCode: error.value?.statusCode ?? 404, statusMessage: t('MAPS.NOT_FOUND'), fatal: true });
}

useSeoMeta({ title: () => `${map.value?.title ?? ''} – ${t('GENERAL.MAPS')}` });
</script>

<template>
  <div v-if="map">
    <BreadcrumbTrail :items="[{ title: t('GENERAL.MAPS'), to: routes.maps() }]" />
    <PageHeading :title="map.title" :subtitle="map.description" />
    <InteractiveMap :map="map" />
  </div>
</template>
