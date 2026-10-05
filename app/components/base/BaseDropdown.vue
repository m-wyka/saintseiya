<script setup lang="ts">
const isOpen = ref(false);
const root = ref<HTMLElement | null>(null);
const trigger = ref<HTMLButtonElement | null>(null);
const panelId = useId();
const route = useRoute();

const close = () => {
  isOpen.value = false;
};

const closeOnOutsidePress = (event: PointerEvent) => {
  if (event.target instanceof Node && !root.value?.contains(event.target)) {
    close();
  }
};

const closeOnEscape = (event: KeyboardEvent) => {
  if (isOpen.value && event.key === 'Escape') {
    close();
    trigger.value?.focus();
  }
};

const closeWhenFocusLeaves = (event: FocusEvent) => {
  if (event.relatedTarget instanceof Node && !root.value?.contains(event.relatedTarget)) {
    close();
  }
};

const closeOnLinkClick = (event: MouseEvent) => {
  if (event.target instanceof Element && event.target.closest('a')) {
    close();
  }
};

watch(() => route.fullPath, close);

onMounted(() => {
  document.addEventListener('pointerdown', closeOnOutsidePress);
  window.addEventListener('keydown', closeOnEscape);
});
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', closeOnOutsidePress);
  window.removeEventListener('keydown', closeOnEscape);
});
</script>

<template>
  <div ref="root" class="relative flex" @focusout="closeWhenFocusLeaves">
    <button
      ref="trigger"
      type="button"
      class="flex cursor-pointer items-center gap-2 px-3 text-aqua-200 transition duration-200 ease-cosmo select-none hover:bg-white/5 hover:text-gold-300 active:scale-[0.97] aria-expanded:bg-white/5 aria-expanded:text-gold-300"
      :aria-expanded="isOpen"
      :aria-controls="isOpen ? panelId : undefined"
      @click="isOpen = !isOpen"
    >
      <slot name="trigger" :is-open="isOpen" />
    </button>
    <Transition
      enter-active-class="transition-[opacity,scale] duration-200 ease-cosmo"
      enter-from-class="scale-95 opacity-0"
      leave-active-class="transition-[opacity,scale] duration-150 ease-cosmo"
      leave-to-class="scale-95 opacity-0"
    >
      <div
        v-if="isOpen"
        :id="panelId"
        class="absolute top-full right-0 z-50 mt-2 w-64 origin-top-right rounded-xl border border-cosmo-500/40 bg-abyss-900 p-2 text-mist shadow-panel"
        @click="closeOnLinkClick"
      >
        <slot :close="close" />
      </div>
    </Transition>
  </div>
</template>
