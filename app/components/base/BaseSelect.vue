<script setup lang="ts" generic="Value extends string | number">
const model = defineModel<Value>();

withDefaults(
  defineProps<{
    label: string;
    options: { value: Value; label: string }[];
    hint?: string;
    error?: string;
    required?: boolean;
    hideLabel?: boolean;
  }>(),
  { hint: undefined, error: undefined },
);

const selectId = useId();
const messageId = `${selectId}-message`;
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label
      :for="selectId"
      class="text-xs font-semibold tracking-wide text-aqua-300 uppercase"
      :class="{ 'sr-only': hideLabel }"
    >
      {{ label }}
      <span v-if="required" class="text-cosmo-500" aria-hidden="true">*</span>
    </label>
    <div class="relative">
      <select
        :id="selectId"
        v-model="model"
        :required="required"
        :aria-invalid="Boolean(error) || undefined"
        :aria-describedby="error || hint ? messageId : undefined"
        class="w-full cursor-pointer appearance-none rounded-lg border bg-black/40 py-2 pr-9 pl-3 text-sm text-mist transition duration-200 focus:border-cosmo-500 focus:shadow-aura focus:outline-none"
        :class="error ? 'border-danger/70' : 'border-aqua-500/30 hover:border-aqua-500/60'"
      >
        <option v-for="option in options" :key="option.value" :value="option.value" class="bg-abyss-900">
          {{ option.label }}
        </option>
      </select>
      <AppIcon
        name="chevronDown"
        class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-cosmo-500"
      />
    </div>
    <p v-if="error || hint" :id="messageId" class="text-xs" :class="error ? 'text-danger' : 'text-aqua-500'">
      {{ error || hint }}
    </p>
  </div>
</template>
