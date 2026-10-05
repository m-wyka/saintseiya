<script setup lang="ts">
import { routes } from '#shared/utils/routes';

const { t } = useI18n();
const routeSlug = useRouteParam('slug');
const page = usePageQuery();
const redirectPastLastPage = useLastPageRedirect();
const { data, error } = await useFetch(() => `/api/gallery/albums/${routeSlug.value}`, { query: { page } });

if (error.value || !data.value) {
  throw createError({
    statusCode: error.value?.statusCode ?? 404,
    statusMessage: t('GALLERY.ALBUM_NOT_FOUND'),
    fatal: true,
  });
}

await redirectPastLastPage(data.value.photos);

useSeoMeta({ title: () => `${data.value?.album.title ?? ''} – ${t('GENERAL.GALLERY')}` });
</script>

<template>
  <div v-if="data">
    <BreadcrumbTrail :items="[{ title: t('GENERAL.GALLERY'), to: routes.gallery() }]" />
    <PageHeading :title="data.album.title" :subtitle="data.album.description" />
    <ul v-if="data.photos.items.length" class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
      <li v-for="photo in data.photos.items" :key="photo.id" class="reveal">
        <NuxtLinkLocale
          :to="routes.photo(photo.id)"
          class="group block aspect-square overflow-hidden rounded-xl border border-aqua-500/20 bg-black/40 transition duration-300 ease-cosmo hover:border-cosmo-500 hover:shadow-aura"
          :title="photo.title"
        >
          <img
            :src="routes.media(photo.thumbnail)"
            :alt="photo.title || data.album.title"
            loading="lazy"
            class="size-full object-cover transition duration-500 ease-cosmo group-hover:scale-110"
          />
        </NuxtLinkLocale>
      </li>
    </ul>
    <EmptyState v-else :message="t('GALLERY.ALBUM_EMPTY')" />
    <PaginationNav :page="data.photos.page" :page-count="data.photos.pageCount" />
  </div>
</template>
