<script setup lang="ts">
import { routes } from '#shared/utils/routes';

const route = useRoute('galeria-zdjecie-id');
const { data: photo, error } = await useFetch(() => `/api/gallery/photos/${route.params.id}`);

if (error.value || !photo.value) {
  throw createError({
    statusCode: error.value?.statusCode ?? 404,
    statusMessage: 'Nie znaleziono zdjęcia',
    fatal: true,
  });
}

const title = computed(() => photo.value?.title || photo.value?.album.title || 'Grafika');

useSeoMeta({ title: () => `${title.value} – Galeria` });
</script>

<template>
  <div v-if="photo">
    <BreadcrumbTrail
      :items="[
        { title: 'Galeria', to: routes.gallery() },
        { title: photo.album.title, to: routes.album(photo.album.slug) },
      ]"
    />
    <PageHeading :title="title" />
    <figure class="overflow-hidden panel">
      <div class="relative grid place-items-center bg-black/60 p-3">
        <img
          :src="routes.media(photo.image)"
          :alt="title"
          :width="photo.width"
          :height="photo.height"
          class="max-h-[78vh] w-auto max-w-full animate-rise rounded-lg object-contain"
        />
        <NuxtLink
          v-if="photo.previousPhotoId"
          :to="routes.photo(photo.previousPhotoId)"
          class="absolute top-1/2 left-3 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-xl text-cosmo-400 backdrop-blur-sm transition hover:cosmo-bar hover:text-abyss-950"
          aria-label="Poprzednia grafika"
        >
          <AppIcon name="chevronLeft" />
        </NuxtLink>
        <NuxtLink
          v-if="photo.nextPhotoId"
          :to="routes.photo(photo.nextPhotoId)"
          class="absolute top-1/2 right-3 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-xl text-cosmo-400 backdrop-blur-sm transition hover:cosmo-bar hover:text-abyss-950"
          aria-label="Następna grafika"
        >
          <AppIcon name="chevronRight" />
        </NuxtLink>
      </div>
      <figcaption class="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-xs text-aqua-300">
        <p class="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span v-if="photo.author" class="flex items-center gap-1.5">
            <AppIcon name="user" class="text-cosmo-500" />
            <AuthorName :author="photo.author" />
          </span>
          <time :datetime="photo.createdAt" class="flex items-center gap-1.5">
            <AppIcon name="calendar" class="text-cosmo-500" />
            {{ formatLongDate(photo.createdAt) }}
          </time>
          <span class="flex items-center gap-1.5">
            <AppIcon name="eye" class="text-cosmo-500" />
            {{ pluralize(photo.viewCount, 'odsłona', 'odsłony', 'odsłon') }}
          </span>
        </p>
        <BaseButton :to="routes.media(photo.image)" variant="secondary" size="sm" target="_blank">
          <AppIcon name="external" />
          Pełny rozmiar ({{ photo.width }}×{{ photo.height }})
        </BaseButton>
      </figcaption>
      <p v-if="photo.description" class="border-t border-aqua-500/15 px-5 py-3 text-sm text-aqua-200">
        {{ photo.description }}
      </p>
    </figure>
    <CommentSection target-kind="photo" :target-id="photo.id" enabled />
  </div>
</template>
