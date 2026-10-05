<script setup lang="ts">
const model = defineModel<string>({ default: '' });

withDefaults(
  defineProps<{
    label: string;
    type?: 'text' | 'search' | 'email' | 'url' | 'number';
    placeholder?: string;
    hint?: string;
    error?: string;
    required?: boolean;
    hideLabel?: boolean;
    maxlength?: number;
    name?: string;
    autofocus?: boolean;
  }>(),
  { type: 'text', placeholder: undefined, hint: undefined, error: undefined, maxlength: undefined, name: undefined },
);

const inputId = useId();
const messageId = `${inputId}-message`;
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label
      :for="inputId"
      class="text-xs font-semibold tracking-wide text-aqua-300 uppercase"
      :class="{ 'sr-only': hideLabel }"
    >
      {{ label }}
      <span v-if="required" class="text-cosmo-500" aria-hidden="true">*</span>
    </label>
    <input
      :id="inputId"
      v-model="model"
      :type="type"
      :name="name"
      :placeholder="placeholder"
      :required="required"
      :maxlength="maxlength"
      :autofocus="autofocus"
      :aria-invalid="Boolean(error) || undefined"
      :aria-describedby="error || hint ? messageId : undefined"
      class="w-full rounded-lg border bg-black/40 px-3 py-2 text-sm text-mist transition duration-200 placeholder:text-aqua-500/70 focus:border-cosmo-500 focus:shadow-aura focus:outline-none"
      :class="error ? 'border-danger/70' : 'border-aqua-500/30 hover:border-aqua-500/60'"
    />
    <p v-if="error || hint" :id="messageId" class="text-xs" :class="error ? 'text-danger' : 'text-aqua-500'">
      {{ error || hint }}
    </p>
  </div>
</template>
