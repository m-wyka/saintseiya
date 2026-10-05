<script setup lang="ts">
const props = defineProps<{ download: { id: number; title: string; description: string } | null }>();
const emit = defineEmits<{ saved: []; cancel: [] }>();

const title = ref(props.download?.title ?? '');
const description = ref(props.download?.description ?? '');
const pickedFile = ref<File | null>(null);
const fileInputId = useId();
const fileHintId = `${fileInputId}-hint`;
const { isBusy, errorMessage, run } = useApiAction();
const toasts = useToastStore();

const pickFile = (event: Event) => {
  pickedFile.value = (event.target as HTMLInputElement).files?.[0] ?? null;
};

const uploadNew = () => {
  const form = new FormData();
  form.append('title', title.value);
  form.append('description', description.value);
  if (pickedFile.value) {
    form.append('file', pickedFile.value);
  }
  return apiRequest('/api/admin/downloads', { method: 'POST', body: form });
};

const saveDetails = (id: number) =>
  apiRequest(`/api/admin/downloads/${id}`, {
    method: 'PUT',
    body: { title: title.value, description: description.value },
  });

const save = async () => {
  const { download } = props;
  const wasSaved = await run(() => (download ? saveDetails(download.id) : uploadNew()));
  if (wasSaved) {
    toasts.success('Zapisano');
    emit('saved');
  }
};
</script>

<template>
  <form class="mb-6 flex animate-rise flex-col gap-4 panel p-5" @submit.prevent="save">
    <h2 class="heading-display text-lg text-gold-300">{{ download ? 'Edycja' : 'Dodaj plik' }}</h2>
    <div class="grid gap-4 md:grid-cols-2">
      <BaseInput v-model="title" label="Tytuł" :maxlength="200" required />
      <div v-if="!download" class="flex flex-col gap-1.5">
        <label :for="fileInputId" class="text-xs font-semibold tracking-wide text-aqua-300 uppercase">
          Plik
          <span class="text-cosmo-500" aria-hidden="true">*</span>
        </label>
        <input
          :id="fileInputId"
          type="file"
          required
          :aria-describedby="fileHintId"
          class="w-full cursor-pointer rounded-lg border border-aqua-500/30 bg-black/40 text-sm text-aqua-200 transition duration-200 file:mr-3 file:cursor-pointer file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-gold-300 hover:border-aqua-500/60"
          @change="pickFile"
        />
        <p :id="fileHintId" class="text-xs text-aqua-500">
          ZIP, RAR, 7Z, PDF, DOC, DOCX, TXT, SRT, ASS lub MP3, najwyżej 50 MB
        </p>
      </div>
      <BaseTextarea v-model="description" class="md:col-span-2" label="Opis" :maxlength="1000" />
    </div>
    <p v-if="download" class="text-xs text-aqua-500">
      Samego pliku nie da się podmienić. Usuń tę pozycję i dodaj ją ponownie z nowym plikiem.
    </p>
    <InlineFormActions :is-busy="isBusy" :error-message="errorMessage" @cancel="emit('cancel')" />
  </form>
</template>
