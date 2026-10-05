<script setup lang="ts">
const confirmation = useConfirmationStore();
const { t } = useI18n();

const isOpen = computed({
  get: () => confirmation.question !== null,
  set: (shouldStayOpen) => {
    if (!shouldStayOpen) {
      confirmation.answer(false);
    }
  },
});
</script>

<template>
  <BaseDialog v-model="isOpen" :title="t('GENERAL.CONFIRMATION')" compact>
    <p class="text-sm text-aqua-200">{{ confirmation.question }}</p>
    <div class="mt-6 flex justify-end gap-2">
      <BaseButton variant="ghost" autofocus @click="confirmation.answer(false)">{{ t('GENERAL.CANCEL') }}</BaseButton>
      <BaseButton variant="danger" @click="confirmation.answer(true)">{{ t('GENERAL.YES') }}</BaseButton>
    </div>
  </BaseDialog>
</template>
