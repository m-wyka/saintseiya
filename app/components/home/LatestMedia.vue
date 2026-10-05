<script setup lang="ts">
import type { InternalApi } from 'nitropack';
import { routes } from '#shared/utils/routes';

type HomeContent = InternalApi['/api/home']['get'];

defineProps<{ photos: HomeContent['latestPhotos']; videos: HomeContent['latestVideos'] }>();

const { t } = useI18n();

const youtubePoster = (youtubeId: string) => `https://i.ytimg.com/vi/${youtubeId}/mqdefault.jpg`;
</script>

<template>
  <div class="grid gap-8 xl:grid-cols-2">
    <section v-if="photos.length">
      <SectionHeading :title="t('HOME_PANELS.LATEST_PHOTOS')" :link-to="routes.gallery()" />
      <ul class="grid grid-cols-4 gap-2">
        <li v-for="photo in photos" :key="photo.id">
          <NuxtLinkLocale
            :to="routes.photo(photo.id)"
            class="group block aspect-square overflow-hidden rounded-lg border border-aqua-500/20 transition duration-300 hover:border-cosmo-500"
            :title="photo.title || photo.albumTitle"
          >
            <img
              :src="routes.media(photo.thumbnail)"
              :alt="photo.title || photo.albumTitle"
              loading="lazy"
              class="size-full object-cover transition duration-500 ease-cosmo group-hover:scale-110"
            />
          </NuxtLinkLocale>
        </li>
      </ul>
    </section>
    <section v-if="videos.length">
      <SectionHeading :title="t('HOME_PANELS.LATEST_VIDEOS')" :link-to="routes.videos()" />
      <ul class="grid grid-cols-2 gap-2">
        <li v-for="video in videos" :key="video.id">
          <NuxtLinkLocale
            :to="routes.videos()"
            class="group relative block aspect-video overflow-hidden rounded-lg border border-aqua-500/20 transition duration-300 hover:border-cosmo-500"
          >
            <img
              :src="youtubePoster(video.youtubeId)"
              :alt="video.title"
              loading="lazy"
              class="size-full object-cover transition duration-500 ease-cosmo group-hover:scale-105"
            />
            <span
              class="absolute inset-x-0 bottom-0 truncate bg-linear-to-t from-black to-transparent px-2 pt-6 pb-1.5 text-xs text-white"
            >
              {{ video.title }}
            </span>
            <span
              class="absolute top-1/2 left-1/2 grid size-9 -translate-1/2 place-items-center rounded-full cosmo-bar text-abyss-950 opacity-90 transition group-hover:scale-110"
            >
              <AppIcon name="play" />
            </span>
          </NuxtLinkLocale>
        </li>
      </ul>
    </section>
  </div>
</template>
