<script setup lang="ts">
defineProps<{ isHidden: boolean }>();

const { t } = useI18n();
</script>

<template>
  <StateBadge v-if="isHidden" :label="t('ADMIN_UI.VISIBILITY_HIDDEN')" icon="lock" tone="muted" />
  <StateBadge v-else :label="t('ADMIN_UI.VISIBILITY_VISIBLE')" icon="eye" tone="positive" />
</template>
