<script setup lang="ts">
import { routes } from '#shared/utils/routes';

const { t } = useI18n();
const routeId = useRouteParam('id');
const { data: photo, error } = await useFetch(() => `/api/gallery/photos/${routeId.value}`);

if (error.value || !photo.value) {
  throw createError({
    statusCode: error.value?.statusCode ?? 404,
    statusMessage: t('GALLERY.PHOTO_NOT_FOUND'),
    fatal: true,
  });
}

const title = computed(() => photo.value?.title || photo.value?.album.title || t('GALLERY.PHOTO_FALLBACK_TITLE'));

useSeoMeta({ title: () => `${title.value} – ${t('GENERAL.GALLERY')}` });
</script>

<template>
  <div v-if="photo">
    <BreadcrumbTrail
      :items="[
        { title: t('GENERAL.GALLERY'), to: routes.gallery() },
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
        <NuxtLinkLocale
          v-if="photo.previousPhotoId"
          :to="routes.photo(photo.previousPhotoId)"
          class="absolute top-1/2 left-3 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-xl text-cosmo-400 backdrop-blur-sm transition hover:cosmo-bar hover:text-abyss-950"
          :aria-label="t('GALLERY.PREVIOUS_PHOTO')"
        >
          <AppIcon name="chevronLeft" />
        </NuxtLinkLocale>
        <NuxtLinkLocale
          v-if="photo.nextPhotoId"
          :to="routes.photo(photo.nextPhotoId)"
          class="absolute top-1/2 right-3 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-xl text-cosmo-400 backdrop-blur-sm transition hover:cosmo-bar hover:text-abyss-950"
          :aria-label="t('GALLERY.NEXT_PHOTO')"
        >
          <AppIcon name="chevronRight" />
        </NuxtLinkLocale>
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
            {{ t('GALLERY.VIEW_COUNT', { count: formatNumber(photo.viewCount) }, photo.viewCount) }}
          </span>
        </p>
        <BaseButton :href="routes.media(photo.image)" variant="secondary" size="sm" target="_blank">
          <AppIcon name="external" />
          {{ t('GALLERY.FULL_SIZE', { width: photo.width, height: photo.height }) }}
        </BaseButton>
      </figcaption>
      <p v-if="photo.description" class="border-t border-aqua-500/15 px-5 py-3 text-sm text-aqua-200">
        {{ photo.description }}
      </p>
    </figure>
    <CommentSection target-kind="photo" :target-id="photo.id" enabled />
  </div>
</template>
