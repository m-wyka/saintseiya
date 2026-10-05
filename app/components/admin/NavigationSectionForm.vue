<script setup lang="ts">
const props = defineProps<{ section: { id: number; title: string } | null }>();
const emit = defineEmits<{ saved: []; cancel: [] }>();

const title = ref(props.section?.title ?? '');
const { isBusy, errorMessage, save } = useAdminSave('navigation-sections');

const submit = async () => {
  const wasSaved = await save(props.section?.id ?? null, { title: title.value });
  if (wasSaved) {
    emit('saved');
  }
};
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="submit">
    <BaseInput v-model="title" class="max-w-md" label="Tytuł sekcji" :maxlength="60" required />
    <InlineFormActions :is-busy="isBusy" :error-message="errorMessage" @cancel="emit('cancel')" />
  </form>
</template>
