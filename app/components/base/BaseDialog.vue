<script setup lang="ts">
const isOpen = defineModel<boolean>({ required: true });

defineProps<{ title: string; compact?: boolean }>();

const { t } = useI18n();

const dialog = ref<HTMLDialogElement | null>(null);

watch(isOpen, (shouldOpen) => {
  if (!dialog.value) {
    return;
  }
  if (shouldOpen && !dialog.value.open) {
    dialog.value.showModal();
  } else if (!shouldOpen && dialog.value.open) {
    dialog.value.close();
  }
});

let pressStartedOnBackdrop = false;

const rememberPressTarget = (event: MouseEvent) => {
  pressStartedOnBackdrop = event.target === dialog.value;
};

const closeOnBackdrop = (event: MouseEvent) => {
  if (pressStartedOnBackdrop && event.target === dialog.value) {
    isOpen.value = false;
  }
};
</script>

<template>
  <dialog
    ref="dialog"
    class="m-auto max-h-[85dvh] overflow-hidden rounded-2xl border border-cosmo-500/40 bg-abyss-900 p-0 text-mist shadow-aura backdrop:bg-black/75 backdrop:backdrop-blur-sm open:animate-rise"
    :class="compact ? 'w-[min(26rem,94vw)]' : 'w-[min(52rem,94vw)]'"
    :aria-label="title"
    @close="isOpen = false"
    @mousedown="rememberPressTarget"
    @click="closeOnBackdrop"
  >
    <div class="flex max-h-[85dvh] flex-col">
      <header class="flex items-center justify-between gap-4 cosmo-bar px-5 py-3">
        <h2 class="heading-display text-lg text-abyss-950">{{ title }}</h2>
        <button
          type="button"
          class="cursor-pointer rounded-full p-1.5 text-abyss-950 transition hover:bg-black/15"
          :aria-label="t('GENERAL.CLOSE')"
          @click="isOpen = false"
        >
          <AppIcon name="close" class="text-xl" />
        </button>
      </header>
      <div class="overflow-y-auto p-5">
        <slot />
      </div>
    </div>
  </dialog>
</template>
