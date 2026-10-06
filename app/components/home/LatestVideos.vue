<script setup lang="ts">
import type { InternalApi } from 'nitropack';
import { routes } from '#shared/utils/routes';

type VideoSummary = InternalApi['/api/home']['get']['latestVideos'][number];

const props = defineProps<{ videos: VideoSummary[] }>();

const { t } = useI18n();
const headingId = useId();
const selectedId = ref(props.videos[0]?.id);
const isPlaying = ref(false);
const hasChosen = ref(false);
const removedIds = ref(new Set<number>());

const selectedIndex = computed(() =>
  Math.max(
    0,
    props.videos.findIndex((video) => video.id === selectedId.value),
  ),
);
const selected = computed(() => props.videos[selectedIndex.value]!);

const isRemoved = (video: VideoSummary) => removedIds.value.has(video.id);

const play = (video: VideoSummary) => {
  hasChosen.value = true;
  selectedId.value = video.id;
  isPlaying.value = !isRemoved(video);
};

// Until the visitor picks a film, the screen stays on the newest one that still exists.
const markRemoved = (video: VideoSummary) => {
  removedIds.value.add(video.id);
  if (!hasChosen.value) {
    selectedId.value = (props.videos.find((candidate) => !isRemoved(candidate)) ?? props.videos[0])?.id;
  }
};
</script>

<template>
  <section v-if="videos.length" class="@container reveal stage p-4 @xl:p-6" :aria-labelledby="headingId">
    <SectionHeading :id="headingId" :title="t('HOME_PANELS.LATEST_VIDEOS')" :link-to="routes.videos()" />
    <div class="grid gap-4 @2xl:grid-cols-[minmax(0,1fr)_18rem] @2xl:gap-5">
      <div class="group relative aspect-video overflow-hidden rounded-lg border border-aqua-500/25 bg-black">
        <iframe
          v-if="isPlaying"
          :src="youtubePlayerUrl(selected.youtubeId)"
          :title="selected.title"
          class="absolute inset-0 size-full border-0"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowfullscreen
        />
        <template v-else>
          <VideoPoster
            :key="selected.id"
            :youtube-id="selected.youtubeId"
            quality="hqdefault"
            class="absolute inset-0"
            @removed="markRemoved(selected)"
          />
          <div
            v-if="isRemoved(selected)"
            class="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 p-6 text-center"
          >
            <p class="heading-display text-xl/tight text-gold-200">{{ selected.title }}</p>
            <p class="text-sm text-aqua-300">{{ t('HOME_PANELS.VIDEO_REMOVED') }}</p>
          </div>
          <button
            v-else
            type="button"
            class="absolute inset-0 z-20 flex size-full cursor-pointer items-end bg-linear-to-t from-abyss-950/90 via-transparent to-transparent p-3 text-left @md:p-4"
            :aria-label="t('VIDEO_LIST.PLAY', { title: selected.title })"
            @click="play(selected)"
          >
            <span
              class="line-clamp-1 heading-display text-base/tight text-gold-100 @md:text-lg/tight @2xl:text-xl/tight"
            >
              {{ selected.title }}
            </span>
            <span
              class="absolute top-1/2 left-1/2 grid size-12 -translate-1/2 place-items-center rounded-full cosmo-bar text-2xl text-abyss-950 shadow-aura transition duration-300 ease-cosmo group-hover:scale-110 @md:size-16 @md:text-3xl"
            >
              <AppIcon name="play" />
            </span>
          </button>
        </template>
      </div>

      <div class="relative" :style="{ '--item-count': videos.length, '--active-index': selectedIndex }">
        <span class="sliding-thumb-y rounded-lg border-l-2 border-cosmo-500 bg-white/5" aria-hidden="true" />
        <ul class="relative grid h-full auto-rows-fr">
          <li v-for="video in videos" :key="video.id">
            <button
              type="button"
              class="group flex size-full min-h-18 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left"
              :aria-current="video.id === selected.id ? 'true' : undefined"
              @click="play(video)"
            >
              <VideoPoster
                :youtube-id="video.youtubeId"
                class="aspect-video h-12 shrink-0 rounded-md border border-aqua-500/25"
                @removed="markRemoved(video)"
              />
              <span class="flex min-w-0 flex-col gap-0.5">
                <span
                  class="line-clamp-2 text-sm/snug font-semibold transition duration-200 group-hover:text-gold-300 group-aria-[current]:text-gold-300"
                  :class="isRemoved(video) ? 'text-aqua-500' : 'text-aqua-200'"
                >
                  {{ video.title }}
                </span>
                <span v-if="isRemoved(video)" class="text-[0.7rem] text-aqua-500">
                  {{ t('HOME_PANELS.VIDEO_REMOVED_TAG') }}
                </span>
                <span v-else-if="isPlaying && video.id === selected.id" class="text-[0.7rem] text-cosmo-400">
                  {{ t('HOME_PANELS.NOW_PLAYING') }}
                </span>
              </span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
