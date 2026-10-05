<script setup lang="ts">
import type { ContentStatus } from '#shared/utils/content';

defineProps<{ status: ContentStatus }>();
</script>

<template>
  <StateBadge v-if="status === 'published'" label="Opublikowano" icon="check" tone="positive" />
  <StateBadge v-else label="Szkic" icon="edit" tone="muted" />
</template>
