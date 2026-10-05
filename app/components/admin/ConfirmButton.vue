<script setup lang="ts">
withDefaults(defineProps<{ label?: string; confirmLabel?: string }>(), { label: 'Usuń', confirmLabel: 'Na pewno?' });
const emit = defineEmits<{ confirm: [] }>();

const CONFIRMATION_WINDOW_MS = 4000;
const isArmed = ref(false);
let disarmTimer: ReturnType<typeof setTimeout> | undefined;

const press = () => {
  clearTimeout(disarmTimer);
  if (isArmed.value) {
    isArmed.value = false;
    emit('confirm');
    return;
  }
  isArmed.value = true;
  disarmTimer = setTimeout(() => (isArmed.value = false), CONFIRMATION_WINDOW_MS);
};

onBeforeUnmount(() => clearTimeout(disarmTimer));
</script>

<template>
  <BaseButton :variant="isArmed ? 'danger' : 'ghost'" size="sm" @click="press">
    <AppIcon :name="isArmed ? 'warning' : 'trash'" />
    {{ isArmed ? confirmLabel : label }}
  </BaseButton>
</template>
