<script setup lang="ts">
const props = defineProps<{ postId: number }>();
const emit = defineEmits<{ saved: []; cancel: [] }>();

const editedHtml = ref<string>();
const { isBusy, errorMessage, run } = useApiAction();
const { t } = useI18n();

onMounted(() =>
  run(async () => {
    editedHtml.value = (await $fetch(`/api/forum/posts/${props.postId}`)).bodyHtml;
  }),
);

const save = async () => {
  const wasSaved = await run(() =>
    apiRequest(`/api/forum/posts/${props.postId}`, { method: 'PATCH', body: { bodyHtml: editedHtml.value } }),
  );
  if (wasSaved) {
    emit('saved');
  }
};
</script>

<template>
  <form class="flex flex-1 flex-col gap-3 px-5 py-4" @submit.prevent="save">
    <RichTextEditor v-if="editedHtml !== undefined" v-model="editedHtml" :label="t('POSTS.BODY_LABEL')" />
    <div v-else class="h-48 animate-pulse rounded-xl border border-aqua-500/20 bg-black/30" />
    <p v-if="errorMessage" class="flex items-center gap-2 text-sm text-danger" role="alert">
      <AppIcon name="warning" />
      {{ errorMessage }}
    </p>
    <div class="flex flex-wrap justify-end gap-2">
      <BaseButton variant="ghost" size="sm" @click="emit('cancel')">{{ t('GENERAL.CANCEL') }}</BaseButton>
      <BaseButton type="submit" size="sm" :busy="isBusy" :disabled="!editedHtml">
        <AppIcon name="check" />
        {{ t('POSTS.SAVE_CHANGES') }}
      </BaseButton>
    </div>
  </form>
</template>
