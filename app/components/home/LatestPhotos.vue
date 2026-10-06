<script setup lang="ts">
import type { InternalApi } from 'nitropack';
import { routes } from '#shared/utils/routes';

type PhotoSummary = InternalApi['/api/home']['get']['latestPhotos'][number];

const props = defineProps<{ photos: PhotoSummary[] }>();

const { t } = useI18n();
const headingId = useId();
const openedId = ref(props.photos[0]?.id);
</script>

<template>
  <section v-if="photos.length" class="@container reveal stage p-4 @xl:p-6" :aria-labelledby="headingId">
    <SectionHeading :id="headingId" :title="t('HOME_PANELS.LATEST_PHOTOS')" :link-to="routes.gallery()" />
    <ul class="roster rounded-lg">
      <li
        v-for="photo in photos"
        :key="photo.id"
        :data-active="photo.id === openedId || undefined"
        @pointerenter="openedId = photo.id"
        @focusin="openedId = photo.id"
      >
        <NuxtLinkLocale :to="routes.photo(photo.id)">
          <img :src="routes.media(photo.thumbnail)" alt="" loading="lazy" class="size-full object-cover" />
          <span class="roster-caption">
            <span class="truncate heading-display text-base/tight text-gold-100">
              {{ photo.title || photo.albumTitle }}
            </span>
            <span v-if="photo.title" class="truncate text-[0.7rem] text-aqua-200">{{ photo.albumTitle }}</span>
          </span>
        </NuxtLinkLocale>
      </li>
    </ul>
  </section>
</template>
