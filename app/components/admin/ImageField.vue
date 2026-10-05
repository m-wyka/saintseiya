<script setup lang="ts">
import { routes } from '#shared/utils/routes';

const storedPath = defineModel<string | null>({ default: null });

defineProps<{ label: string; hint?: string }>();

const { isBusy, errorMessage, run } = useApiAction();
const fileInput = ref<HTMLInputElement | null>(null);

const upload = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) {
    return;
  }
  const form = new FormData();
  form.append('file', file);
  await run(async () => {
    const [stored] = await apiRequest<{ image: string }[]>('/api/admin/media', { method: 'POST', body: form });
    storedPath.value = stored?.image ?? null;
  });
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <p class="text-xs font-semibold tracking-wide text-aqua-300 uppercase">{{ label }}</p>
    <div class="flex flex-wrap items-center gap-3">
      <img
        v-if="storedPath"
        :src="routes.media(storedPath)"
        alt=""
        class="h-24 w-auto max-w-40 rounded-lg border border-aqua-500/30 object-cover"
      />
      <span
        v-else
        class="grid size-24 place-items-center rounded-lg border border-dashed border-aqua-500/30 text-2xl text-aqua-500"
      >
        <AppIcon name="image" />
      </span>
      <div class="flex flex-col items-start gap-2">
        <input
          ref="fileInput"
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          class="sr-only"
          :aria-label="label"
          @change="upload"
        />
        <BaseButton variant="secondary" size="sm" :busy="isBusy" @click="fileInput?.click()">
          <AppIcon name="plus" />
          {{ storedPath ? 'Zmień obrazek' : 'Wgraj obrazek' }}
        </BaseButton>
        <BaseButton v-if="storedPath" variant="ghost" size="sm" @click="storedPath = null">
          <AppIcon name="trash" />
          Usuń obrazek
        </BaseButton>
      </div>
    </div>
    <p v-if="errorMessage || hint" class="text-xs" :class="errorMessage ? 'text-danger' : 'text-aqua-500'">
      {{ errorMessage || hint }}
    </p>
  </div>
</template>
