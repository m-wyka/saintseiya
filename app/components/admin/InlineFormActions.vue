<script setup lang="ts">
defineProps<{ isBusy: boolean; errorMessage: string }>();
const emit = defineEmits<{ cancel: [] }>();
</script>

<template>
  <div class="flex flex-col gap-3">
    <p v-if="errorMessage" class="flex items-center gap-2 text-sm text-danger" role="alert">
      <AppIcon name="warning" />
      {{ errorMessage }}
    </p>
    <div class="flex flex-wrap gap-2">
      <BaseButton type="submit" :busy="isBusy">
        <AppIcon name="check" />
        Zapisz
      </BaseButton>
      <BaseButton variant="ghost" @click="emit('cancel')">Anuluj</BaseButton>
    </div>
  </div>
</template>
