<script setup lang="ts">
const page = defineModel<number>({ required: true });

defineProps<{ pageCount: number }>();

const { t } = useI18n();
</script>

<template>
  <nav v-if="pageCount > 1" class="mt-4 flex items-center justify-center gap-3" :aria-label="t('ADMIN_UI.PAGINATION')">
    <BaseButton variant="secondary" size="sm" :disabled="page <= 1" @click="page -= 1">
      <AppIcon name="chevronLeft" />
      {{ t('ADMIN_UI.PREVIOUS_PAGE') }}
    </BaseButton>
    <span class="text-xs text-aqua-500 tabular-nums">{{ page }} / {{ pageCount }}</span>
    <BaseButton variant="secondary" size="sm" :disabled="page >= pageCount" @click="page += 1">
      {{ t('ADMIN_UI.NEXT_PAGE') }}
      <AppIcon name="chevronRight" />
    </BaseButton>
  </nav>
</template>
