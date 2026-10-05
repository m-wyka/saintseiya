<script setup lang="ts">
import { USER_ROLE_LABELS, USER_ROLES } from '#shared/utils/roles';
import type { UserRole } from '#shared/utils/roles';

const { fetch: refreshSession } = useUserSession();
const { isBusy, errorMessage, run } = useApiAction();

const name = ref('Rycerz Testowy');
const role = ref<UserRole>('admin');
const roleOptions = USER_ROLES.map((value) => ({ value, label: USER_ROLE_LABELS[value] }));

const signIn = async () => {
  const signedIn = await run(() =>
    apiRequest('/api/auth/e2e-login', {
      method: 'POST',
      body: { googleId: `test:${name.value}`, name: name.value, role: role.value },
    }),
  );
  if (signedIn) {
    await refreshSession();
    await navigateTo('/');
  }
};

useSeoMeta({ title: 'Logowanie testowe', robots: 'noindex' });
</script>

<template>
  <div class="max-w-md">
    <PageHeading title="Logowanie testowe" subtitle="Działa tylko, gdy serwer ma włączone NUXT_E2E_LOGIN=true." />
    <form class="flex flex-col gap-4 panel p-6" @submit.prevent="signIn">
      <BaseInput v-model="name" label="Nick" required />
      <BaseSelect v-model="role" label="Rola" :options="roleOptions" />
      <p v-if="errorMessage" class="text-sm text-danger" role="alert">{{ errorMessage }}</p>
      <BaseButton type="submit" :busy="isBusy">Zaloguj</BaseButton>
    </form>
  </div>
</template>
