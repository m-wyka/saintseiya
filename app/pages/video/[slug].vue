<script setup lang="ts">
const routeSlug = useRouteParam('slug');
</script>

<template>
  <VideoListing :key="routeSlug" :category-slug="routeSlug" />
</template>
