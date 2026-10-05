<script setup lang="ts">
import { userRoleLabelKey } from '#shared/utils/roles';

definePageMeta({ middleware: 'auth' });

const { t } = useI18n();
const localePath = useLocalePath();
const { user, fetch: refreshSession, clear } = useUserSession();
const toasts = useToastStore();
const rename = useApiAction();
const removal = useApiAction();

const name = ref(user.value?.name ?? '');
const isConfirmingRemoval = ref(false);

const saveName = async () => {
  const saved = await rename.run(() => apiRequest('/api/account', { method: 'PATCH', body: { name: name.value } }));
  if (saved) {
    await refreshSession();
    toasts.success(t('ACCOUNT.NAME_CHANGED'));
  }
};

const removeAccount = async () => {
  const removed = await removal.run(() => apiRequest('/api/account', { method: 'DELETE' }));
  if (removed) {
    await clear();
    toasts.success(t('ACCOUNT.REMOVED'));
    await navigateTo(localePath('/'));
  }
};

useSeoMeta({ title: () => t('ACCOUNT.TITLE') });
</script>

<template>
  <div v-if="user" class="flex max-w-2xl flex-col gap-6">
    <PageHeading :title="t('ACCOUNT.TITLE')" :subtitle="t('ACCOUNT.ROLE', { role: t(userRoleLabelKey(user.role)) })" />

    <form class="flex flex-col gap-4 panel p-6" @submit.prevent="saveName">
      <h2 class="heading-display text-lg text-gold-300">{{ t('ACCOUNT.NAME_HEADING') }}</h2>
      <BaseInput
        v-model="name"
        :label="t('ACCOUNT.NAME_LABEL')"
        :hint="t('ACCOUNT.NAME_HINT')"
        :error="rename.errorMessage.value"
        :maxlength="30"
        required
      />
      <div>
        <BaseButton type="submit" :busy="rename.isBusy.value" :disabled="name.trim() === user.name">{{
          t('ACCOUNT.SAVE_NAME')
        }}</BaseButton>
      </div>
    </form>

    <section class="flex flex-col gap-3 panel border-danger/30 p-6">
      <h2 class="heading-display text-lg text-danger">{{ t('ACCOUNT.REMOVAL_HEADING') }}</h2>
      <p class="text-sm text-aqua-300">
        {{ t('ACCOUNT.REMOVAL_DESCRIPTION', { caption: t('GENERAL.DELETED_ACCOUNT') }) }}
      </p>
      <p v-if="removal.errorMessage.value" class="text-sm text-danger" role="alert">{{ removal.errorMessage.value }}</p>
      <div class="flex flex-wrap gap-2">
        <BaseButton v-if="!isConfirmingRemoval" variant="danger" @click="isConfirmingRemoval = true">
          <AppIcon name="trash" />
          {{ t('ACCOUNT.REMOVE') }}
        </BaseButton>
        <template v-else>
          <BaseButton variant="danger" :busy="removal.isBusy.value" @click="removeAccount">{{
            t('ACCOUNT.CONFIRM_REMOVAL')
          }}</BaseButton>
          <BaseButton variant="ghost" @click="isConfirmingRemoval = false">{{ t('GENERAL.CANCEL') }}</BaseButton>
        </template>
      </div>
    </section>
  </div>
</template>
