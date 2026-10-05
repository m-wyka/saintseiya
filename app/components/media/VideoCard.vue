<script setup lang="ts">
const props = defineProps<{
  video: { title: string; description: string; youtubeId: string; categoryName?: string };
}>();

const isPlaying = ref(false);
const posterUrl = computed(() => `https://i.ytimg.com/vi/${props.video.youtubeId}/hqdefault.jpg`);
const playerUrl = computed(() => `https://www.youtube-nocookie.com/embed/${props.video.youtubeId}?autoplay=1`);
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
      <button
        v-else
        type="button"
        class="absolute inset-0 size-full cursor-pointer"
        :aria-label="`Odtwórz: ${video.title}`"
        @click="isPlaying = true"
      >
        <img
          :src="posterUrl"
          alt=""
          loading="lazy"
          class="size-full object-cover transition duration-500 ease-cosmo group-hover:scale-105"
        />
        <span
          class="absolute top-1/2 left-1/2 grid size-14 -translate-1/2 place-items-center rounded-full cosmo-bar text-2xl text-abyss-950 shadow-aura transition duration-300 group-hover:scale-110"
        >
          <AppIcon name="play" />
        </span>
      </button>
    </div>
    <div class="flex flex-1 flex-col gap-1 p-4">
      <h3 class="font-semibold text-gold-300">{{ video.title }}</h3>
      <p v-if="video.description" class="text-xs text-aqua-300">{{ video.description }}</p>
      <p v-if="video.categoryName" class="mt-auto pt-2 text-[0.7rem] tracking-wide text-aqua-500 uppercase">
        {{ video.categoryName }}
      </p>
    </div>
  </article>
</template>
