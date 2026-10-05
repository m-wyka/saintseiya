<script setup lang="ts">
const model = defineModel<boolean>({ default: false });

defineProps<{ label: string; hint?: string }>();
</script>

<template>
  <label class="group flex cursor-pointer items-start gap-3 text-sm text-aqua-200">
    <input v-model="model" type="checkbox" class="peer sr-only" />
    <span
      class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border border-aqua-500/40 bg-black/40 text-transparent transition duration-150 group-hover:border-cosmo-500 peer-checked:border-transparent peer-checked:cosmo-bar peer-checked:text-abyss-950 peer-focus-visible:outline-2 peer-focus-visible:outline-aqua-400"
    >
      <AppIcon name="check" class="text-xs" />
    </span>
    <span>
      {{ label }}
      <span v-if="hint" class="block text-xs text-aqua-500">{{ hint }}</span>
    </span>
  </label>
</template>
