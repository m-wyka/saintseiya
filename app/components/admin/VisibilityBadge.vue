<script setup lang="ts">
defineProps<{ isHidden: boolean }>();
</script>

<template>
  <StateBadge v-if="isHidden" label="Ukryty" icon="lock" tone="muted" />
  <StateBadge v-else label="Widoczny" icon="eye" tone="positive" />
</template>
