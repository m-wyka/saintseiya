<script setup lang="ts">
import { routes } from '#shared/utils/routes';

const { data: albums } = await useFetch('/api/gallery');

useSeoMeta({ title: 'Galeria' });
</script>

<template>
  <div>
    <PageHeading title="Galeria" subtitle="Tapety, avatary, fan arty, komiksy i okładki." />
    <ul class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      <li v-for="album in albums" :key="album.slug" class="reveal">
        <NuxtLink
          :to="routes.album(album.slug)"
          class="group flex h-full flex-col overflow-hidden panel transition duration-300 ease-cosmo hover:-translate-y-1 hover:border-cosmo-500/60 hover:shadow-aura"
        >
          <div class="aspect-16/10 overflow-hidden bg-black/50">
            <img
              v-if="album.coverImage"
              :src="routes.media(album.coverImage)"
              :alt="album.title"
              loading="lazy"
              class="size-full object-cover transition duration-700 ease-cosmo group-hover:scale-110"
            />
            <span v-else class="grid size-full place-items-center text-4xl text-aqua-500"
              ><AppIcon name="image"
            /></span>
          </div>
          <div class="flex flex-1 flex-col gap-1 p-4">
            <h2 class="heading-display text-lg text-gold-300">{{ album.title }}</h2>
            <p class="line-clamp-2 text-xs text-aqua-300">{{ album.description }}</p>
            <p class="mt-auto pt-2 text-xs font-semibold text-cosmo-400">
              {{ pluralize(album.photoCount, 'grafika', 'grafiki', 'grafik') }}
            </p>
          </div>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
