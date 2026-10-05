<script setup lang="ts">
const model = defineModel<string>({ default: '' });

withDefaults(
  defineProps<{
    label: string;
    rows?: number;
    hint?: string;
    error?: string;
    required?: boolean;
    maxlength?: number;
  }>(),
  { rows: 4, hint: undefined, error: undefined, maxlength: undefined },
);

const textareaId = useId();
const messageId = `${textareaId}-message`;
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label :for="textareaId" class="text-xs font-semibold tracking-wide text-aqua-300 uppercase">
      {{ label }}
      <span v-if="required" class="text-cosmo-500" aria-hidden="true">*</span>
    </label>
    <textarea
      :id="textareaId"
      v-model="model"
      :rows="rows"
      :required="required"
      :maxlength="maxlength"
      :aria-invalid="Boolean(error) || undefined"
      :aria-describedby="error || hint ? messageId : undefined"
      class="w-full rounded-lg border bg-black/40 px-3 py-2 text-sm text-mist transition duration-200 focus:border-cosmo-500 focus:shadow-aura focus:outline-none"
      :class="error ? 'border-danger/70' : 'border-aqua-500/30 hover:border-aqua-500/60'"
    />
    <p v-if="error || hint" :id="messageId" class="text-xs" :class="error ? 'text-danger' : 'text-aqua-500'">
      {{ error || hint }}
    </p>
  </div>
</template>
