<script setup lang="ts">
const layout = useLayoutStore();
const { t } = useI18n();
</script>

<template>
  <p v-if="layout.statistics" class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-aqua-300">
    <span v-if="layout.statistics.memberCount">
      {{ t('LAYOUT.MEMBERS') }}:
      <strong class="text-gold-300">{{ formatNumber(layout.statistics.memberCount) }}</strong>
    </span>
    <span>
      {{ t('LAYOUT.FORUM_POSTS') }}:
      <strong class="text-gold-300">{{ formatNumber(layout.statistics.postCount) }}</strong>
    </span>
    <span>
      {{ t('LAYOUT.COMMENTS') }}:
      <strong class="text-gold-300">{{ formatNumber(layout.statistics.commentCount) }}</strong>
    </span>
  </p>
</template>
