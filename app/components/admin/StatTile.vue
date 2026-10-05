<script setup lang="ts">
import type { IconName } from '~/utils/icons';

defineProps<{
  label: string;
  value: number;
  recent?: number;
  recentPeriodDays?: number;
  note?: string;
  icon: IconName;
}>();

const { t } = useI18n();
</script>

<template>
  <article class="flex flex-col gap-1 panel p-4">
    <p class="flex items-center justify-between gap-2 text-xs text-aqua-300">
      {{ label }}
      <AppIcon :name="icon" class="text-base text-aqua-500" />
    </p>
    <p class="text-3xl font-semibold text-mist">{{ formatNumber(value) }}</p>
    <p v-if="recent !== undefined" class="text-xs text-aqua-500">
      <span :class="recent > 0 ? 'font-semibold text-aqua-200' : ''">+{{ formatNumber(recent) }}</span>
      {{ t('ADMIN_UI.RECENT_PERIOD', { days: recentPeriodDays }) }}
    </p>
    <p v-if="note" class="text-xs text-aqua-500">{{ note }}</p>
  </article>
</template>
