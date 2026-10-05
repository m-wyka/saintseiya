<script setup lang="ts">
const props = defineProps<{ question: string; label?: string }>();
const emit = defineEmits<{ confirm: [] }>();

const { t } = useI18n();
const confirmation = useConfirmationStore();

const press = async () => {
  if (await confirmation.ask(props.question)) {
    emit('confirm');
  }
};
</script>

<template>
  <BaseButton variant="ghost" size="sm" aria-haspopup="dialog" @click="press">
    <AppIcon name="trash" />
    {{ label ?? t('GENERAL.DELETE') }}
  </BaseButton>
</template>
