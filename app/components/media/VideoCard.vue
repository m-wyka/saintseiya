<script setup lang="ts">
const props = defineProps<{
  video: { title: string; description: string; youtubeId: string; categoryName?: string };
}>();

const { t } = useI18n();
const isPlaying = ref(false);
const isRemoved = ref(false);
const playerUrl = computed(() => youtubePlayerUrl(props.video.youtubeId));
</script>

<template>
  <article
    class="group flex reveal flex-col overflow-hidden panel transition duration-300 ease-cosmo hover:border-cosmo-500/50"
  >
    <div class="relative aspect-video bg-black">
      <iframe
        v-if="isPlaying"
        :src="playerUrl"
        :title="video.title"
        class="absolute inset-0 size-full border-0"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowfullscreen
      />
      <template v-else>
        <VideoPoster
          :youtube-id="video.youtubeId"
          quality="hqdefault"
          class="absolute inset-0"
          @removed="isRemoved = true"
        />
        <p
          v-if="isRemoved"
          class="absolute inset-0 z-20 flex flex-col items-center justify-center gap-1 p-4 text-center text-sm text-aqua-300"
        >
          <span class="text-[0.7rem] font-semibold tracking-wide text-aqua-500 uppercase">
            {{ t('VIDEO_LIST.REMOVED_TAG') }}
          </span>
          {{ t('VIDEO_LIST.REMOVED') }}
        </p>
        <button
          v-else
          type="button"
          class="absolute inset-0 z-20 size-full cursor-pointer"
          :aria-label="t('VIDEO_LIST.PLAY', { title: video.title })"
          @click="isPlaying = true"
        >
          <span
            class="absolute top-1/2 left-1/2 grid size-14 -translate-1/2 place-items-center rounded-full cosmo-bar text-2xl text-abyss-950 shadow-aura transition duration-300 group-hover:scale-110"
          >
            <AppIcon name="play" />
          </span>
        </button>
      </template>
    </div>
    <div class="flex flex-1 flex-col gap-1 p-4">
      <h2 class="font-semibold" :class="isRemoved ? 'text-aqua-300' : 'text-gold-300'">{{ video.title }}</h2>
      <p v-if="video.description" class="text-xs text-aqua-300">{{ video.description }}</p>
      <p v-if="video.categoryName" class="mt-auto pt-2 text-[0.7rem] tracking-wide text-aqua-500 uppercase">
        {{ video.categoryName }}
      </p>
    </div>
  </article>
</template>
