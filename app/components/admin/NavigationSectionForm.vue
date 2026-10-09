<script setup lang="ts">
const props = defineProps<{ section: { id: number; title: string } | null }>();
const emit = defineEmits<{ saved: []; cancel: [] }>();

const title = ref(props.section?.title ?? '');
const { isBusy, errorMessage, save } = useAdminSave('navigation-sections');
const contentLocale = useContentLocaleStore();
const { t } = useI18n();
useUnsavedChanges(() => title.value);

const submit = async () => {
  const wasSaved = await save(props.section?.id ?? null, { title: title.value });
  if (wasSaved) {
    emit('saved');
  }
};
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="submit">
    <BaseInput
      v-model="title"
      class="max-w-md"
      :label="t('ADMIN_FORMS.NAV_SECTION_TITLE')"
      :maxlength="60"
      :required="!contentLocale.isTranslating"
    />
    <InlineFormActions :is-busy="isBusy" :error-message="errorMessage" @cancel="emit('cancel')" />
  </form>
</template>
