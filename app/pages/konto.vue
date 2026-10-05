<script setup lang="ts">
import { GHOST_USER_CAPTION } from '#shared/utils/content';
import { USER_ROLE_LABELS } from '#shared/utils/roles';

definePageMeta({ middleware: 'auth' });

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
    toasts.success('Nick zmieniony');
  }
};

const removeAccount = async () => {
  const removed = await removal.run(() => apiRequest('/api/account', { method: 'DELETE' }));
  if (removed) {
    await clear();
    toasts.success('Konto usunięte');
    await navigateTo('/');
  }
};

useSeoMeta({ title: 'Twoje konto' });
</script>

<template>
  <div v-if="user" class="flex max-w-2xl flex-col gap-6">
    <PageHeading title="Twoje konto" :subtitle="`Rola: ${USER_ROLE_LABELS[user.role]}`" />

    <form class="flex flex-col gap-4 panel p-6" @submit.prevent="saveName">
      <h2 class="heading-display text-lg text-gold-300">Nick</h2>
      <BaseInput
        v-model="name"
        label="Nick widoczny na stronie"
        hint="Od 3 do 30 znaków: litery, cyfry, spacje oraz . _ -"
        :error="rename.errorMessage.value"
        :maxlength="30"
        required
      />
      <div>
        <BaseButton type="submit" :busy="rename.isBusy.value" :disabled="name.trim() === user.name"
          >Zapisz nick</BaseButton
        >
      </div>
    </form>

    <section class="flex flex-col gap-3 panel border-danger/30 p-6">
      <h2 class="heading-display text-lg text-danger">Usunięcie konta</h2>
      <p class="text-sm text-aqua-300">
        Twoje posty i komentarze zostaną na stronie, podpisane nickiem z dopiskiem „{{ GHOST_USER_CAPTION }}”. Dane
        logowania i adres e-mail zostaną trwale usunięte. Tej operacji nie da się cofnąć.
      </p>
      <p v-if="removal.errorMessage.value" class="text-sm text-danger" role="alert">{{ removal.errorMessage.value }}</p>
      <div class="flex flex-wrap gap-2">
        <BaseButton v-if="!isConfirmingRemoval" variant="danger" @click="isConfirmingRemoval = true">
          <AppIcon name="trash" />
          Usuń konto
        </BaseButton>
        <template v-else>
          <BaseButton variant="danger" :busy="removal.isBusy.value" @click="removeAccount"
            >Tak, usuń moje konto</BaseButton
          >
          <BaseButton variant="ghost" @click="isConfirmingRemoval = false">Anuluj</BaseButton>
        </template>
      </div>
    </section>
  </div>
</template>
