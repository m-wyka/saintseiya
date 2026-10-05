<script setup lang="ts">
const route = useRoute('video-slug');
</script>

<template>
  <VideoListing :key="route.params.slug" :category-slug="route.params.slug" />
</template>
