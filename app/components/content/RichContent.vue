<script setup lang="ts">
import { MISSING_IMAGE_TITLE_KEY } from '#shared/utils/content';

const props = defineProps<{ html: string }>();

const { t } = useI18n();
const container = ref<HTMLElement | null>(null);
const localizedHtml = computed(() =>
  props.html.replaceAll(
    `<strong>${MISSING_IMAGE_TITLE_KEY}</strong>`,
    `<strong>${t(MISSING_IMAGE_TITLE_KEY)}</strong>`,
  ),
);
useMissingImagePlaceholders(container, localizedHtml);
</script>

<template>
  <div ref="container" class="rich-content" v-html="localizedHtml" />
</template>
