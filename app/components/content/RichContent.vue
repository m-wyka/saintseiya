<script setup lang="ts">
const props = defineProps<{ html: string }>();

const container = ref<HTMLElement | null>(null);
useMissingImagePlaceholders(container, toRef(props, 'html'));
</script>

<template>
  <div ref="container" class="rich-content" v-html="html" />
</template>
