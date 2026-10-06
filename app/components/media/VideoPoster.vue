<script setup lang="ts">
import type { YoutubePosterQuality } from '~/utils/youtube';

withDefaults(defineProps<{ youtubeId: string; quality?: YoutubePosterQuality }>(), { quality: 'mqdefault' });

const emit = defineEmits<{ removed: [] }>();

const image = useTemplateRef('image');
const isShown = ref(false);

const inspect = () => {
  if (!image.value?.complete) {
    return;
  }
  if (isRemovedVideoPoster(image.value)) {
    emit('removed');
    return;
  }
  isShown.value = image.value.naturalWidth > 0;
};

// The server-rendered image may finish loading before the page becomes interactive.
onMounted(inspect);
</script>

<template>
  <span class="star-chart">
    <img
      ref="image"
      :src="youtubePosterUrl(youtubeId, quality)"
      alt=""
      loading="lazy"
      class="absolute inset-0 z-10 size-full object-cover transition duration-500 ease-cosmo group-hover:scale-105"
      :class="isShown ? 'opacity-100' : 'opacity-0'"
      @load="inspect"
    />
  </span>
</template>
