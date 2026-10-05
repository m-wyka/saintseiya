<script setup lang="ts">
import type { IconName } from '~/utils/icons';

type BadgeTone = 'positive' | 'muted' | 'danger';

defineProps<{ label: string; icon: IconName; tone: BadgeTone }>();

const TONE_CLASSES: Record<BadgeTone, string> = {
  positive: 'border-cosmo-500/50 text-cosmo-400',
  muted: 'border-aqua-500/30 text-aqua-500',
  danger: 'border-danger/60 text-danger',
};
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[0.7rem] font-semibold tracking-wide whitespace-nowrap uppercase"
    :class="TONE_CLASSES[tone]"
  >
    <AppIcon :name="icon" />
    {{ label }}
  </span>
</template>
