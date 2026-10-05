<script setup lang="ts">
import type { MoveDirection } from '#shared/utils/ordering';

defineProps<{ itemLabel: string; isFirst: boolean; isLast: boolean }>();
const emit = defineEmits<{ move: [direction: MoveDirection] }>();

const { t } = useI18n();
</script>

<template>
  <span class="inline-flex items-center">
    <BaseButton
      variant="ghost"
      size="sm"
      :disabled="isFirst"
      :aria-label="t('ADMIN_UI.MOVE_UP', { name: itemLabel })"
      @click="emit('move', 'previous')"
    >
      <AppIcon name="chevronDown" class="rotate-180" />
    </BaseButton>
    <BaseButton
      variant="ghost"
      size="sm"
      :disabled="isLast"
      :aria-label="t('ADMIN_UI.MOVE_DOWN', { name: itemLabel })"
      @click="emit('move', 'next')"
    >
      <AppIcon name="chevronDown" />
    </BaseButton>
  </span>
</template>
