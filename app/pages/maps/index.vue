<script setup lang="ts">
import { routes } from '#shared/utils/routes';

const { t } = useI18n();
const { data: maps } = await useFetch('/api/maps');

useSeoMeta({ title: () => t('MAPS.TITLE') });
</script>

<template>
  <div>
    <PageHeading :title="t('MAPS.TITLE')" :subtitle="t('MAPS.SUBTITLE')" />
    <ul v-if="maps?.length" class="grid gap-5 sm:grid-cols-2">
      <li v-for="map in maps" :key="map.slug" class="reveal">
        <NuxtLinkLocale
          :to="routes.map(map.slug)"
          class="group relative block overflow-hidden panel transition duration-300 ease-cosmo hover:-translate-y-1 hover:border-cosmo-500/60 hover:shadow-aura"
        >
          <div class="aspect-video overflow-hidden bg-black">
            <img
              :src="routes.media(map.image)"
              :alt="map.title"
              loading="lazy"
              class="size-full object-cover opacity-70 transition duration-700 ease-cosmo group-hover:scale-105 group-hover:opacity-100"
            />
          </div>
          <div
            class="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-linear-to-t from-black via-black/80 to-transparent p-4 pt-12"
          >
            <div>
              <h2 class="heading-display text-xl text-gold-300">{{ map.title }}</h2>
              <p v-if="map.description" class="line-clamp-2 text-xs text-aqua-200">{{ map.description }}</p>
            </div>
            <span
              class="grid size-9 shrink-0 place-items-center rounded-full cosmo-bar text-abyss-950 transition duration-300 group-hover:translate-x-1"
            >
              <AppIcon name="chevronRight" />
            </span>
          </div>
        </NuxtLinkLocale>
      </li>
    </ul>
    <EmptyState v-else :message="t('MAPS.EMPTY')" />
  </div>
</template>
