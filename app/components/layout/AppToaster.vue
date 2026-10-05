<script setup lang="ts">
const toastStore = useToastStore();
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
    aria-live="polite"
  >
    <TransitionGroup
      enter-active-class="transition duration-300 ease-cosmo"
      enter-from-class="translate-y-3 opacity-0"
      leave-active-class="transition duration-200"
      leave-to-class="opacity-0"
    >
      <button
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        type="button"
        class="pointer-events-auto flex max-w-md cursor-pointer items-center gap-2 rounded-full border bg-abyss-950/95 px-4 py-2 text-sm shadow-panel backdrop-blur-sm"
        :class="toast.tone === 'success' ? 'border-cosmo-500/60 text-gold-300' : 'border-danger/60 text-danger'"
        @click="toastStore.dismiss(toast.id)"
      >
        <AppIcon :name="toast.tone === 'success' ? 'check' : 'warning'" />
        {{ toast.message }}
      </button>
    </TransitionGroup>
  </div>
</template>
