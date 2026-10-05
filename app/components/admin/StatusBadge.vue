<script setup lang="ts">
import type { ContentStatus } from '#shared/utils/content';

defineProps<{ status: ContentStatus }>();

const { t } = useI18n();
</script>

<template>
  <StateBadge v-if="status === 'published'" :label="t('ADMIN_UI.STATUS_PUBLISHED')" icon="check" tone="positive" />
  <StateBadge v-else :label="t('ADMIN_UI.STATUS_DRAFT')" icon="edit" tone="muted" />
</template>
