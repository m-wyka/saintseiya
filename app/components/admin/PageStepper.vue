<script setup lang="ts">
const page = defineModel<number>({ required: true });

defineProps<{ pageCount: number }>();
</script>

<template>
  <nav v-if="pageCount > 1" class="mt-4 flex items-center justify-center gap-3" aria-label="Stronicowanie">
    <BaseButton variant="secondary" size="sm" :disabled="page <= 1" @click="page -= 1">
      <AppIcon name="chevronLeft" />
      Poprzednia
    </BaseButton>
    <span class="text-xs text-aqua-500 tabular-nums">{{ page }} / {{ pageCount }}</span>
    <BaseButton variant="secondary" size="sm" :disabled="page >= pageCount" @click="page += 1">
      Następna
      <AppIcon name="chevronRight" />
    </BaseButton>
  </nav>
</template>
