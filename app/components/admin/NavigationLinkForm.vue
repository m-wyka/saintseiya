<script setup lang="ts">
interface NavigationLinkDraft {
  id: number | null;
  sectionId: number;
  groupTitle: string | null;
  label: string;
  url: string;
}

const props = defineProps<{ link: NavigationLinkDraft; sectionOptions: { value: number; label: string }[] }>();
const emit = defineEmits<{ saved: []; cancel: [] }>();

const input = ref({
  sectionId: props.link.sectionId,
  groupTitle: props.link.groupTitle ?? '',
  label: props.link.label,
  url: props.link.url,
});
const { isBusy, errorMessage, save } = useAdminSave('navigation-links');
const { t } = useI18n();

const submit = async () => {
  const wasSaved = await save(props.link.id, input.value);
  if (wasSaved) {
    emit('saved');
  }
};
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="submit">
    <div class="grid gap-4 md:grid-cols-2">
      <BaseInput v-model="input.label" :label="t('ADMIN_FORMS.NAV_LINK_LABEL')" :maxlength="80" required />
      <BaseInput
        v-model="input.url"
        :label="t('GENERAL.ADDRESS')"
        :hint="t('ADMIN_FORMS.NAV_LINK_URL_HINT')"
        :maxlength="300"
        required
      />
      <BaseInput
        v-model="input.groupTitle"
        :label="t('ADMIN_FORMS.NAV_LINK_GROUP')"
        :hint="t('ADMIN_FORMS.NAV_LINK_GROUP_HINT')"
        :maxlength="60"
      />
      <BaseSelect
        v-model="input.sectionId"
        :label="t('ADMIN_FORMS.NAV_LINK_SECTION')"
        :options="sectionOptions"
        required
      />
    </div>
    <InlineFormActions :is-busy="isBusy" :error-message="errorMessage" @cancel="emit('cancel')" />
  </form>
</template>
