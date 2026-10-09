<script setup lang="ts">
import { USER_ROLES, userRoleLabelKey } from '#shared/utils/roles';
import type { UserRole } from '#shared/utils/roles';

const { t } = useI18n();
const localePath = useLocalePath();
const { fetch: refreshSession } = useUserSession();
const { isBusy, errorMessage, run } = useApiAction();

// The form posts to an endpoint that exists only with NUXT_E2E_LOGIN; without it this page does not exist either.
// Only the server knows the setting, so it decides while rendering and hands the answer over.
const isTestLoginEnabled = useState('testLoginEnabled', () => String(useRuntimeConfig().e2eLogin) === 'true');
if (!isTestLoginEnabled.value) {
  throw createError({ statusCode: 404, statusMessage: t('ERROR_PAGE.NOT_FOUND_TITLE'), fatal: true });
}

const name = ref('Rycerz Testowy');
const role = ref<UserRole>('admin');
const roleOptions = computed(() => USER_ROLES.map((value) => ({ value, label: t(userRoleLabelKey(value)) })));

const signIn = async () => {
  const signedIn = await run(() =>
    apiRequest('/api/auth/e2e-login', {
      method: 'POST',
      body: { googleId: `test:${name.value}`, name: name.value, role: role.value },
    }),
  );
  if (signedIn) {
    await refreshSession();
    await navigateTo(localePath('/'));
  }
};

useSeoMeta({ title: () => t('TEST_LOGIN.TITLE'), robots: 'noindex' });
</script>

<template>
  <div class="max-w-md">
    <PageHeading :title="t('TEST_LOGIN.TITLE')" :subtitle="t('TEST_LOGIN.SUBTITLE')" />
    <form class="flex flex-col gap-4 panel p-6" @submit.prevent="signIn">
      <BaseInput v-model="name" :label="t('TEST_LOGIN.NAME_LABEL')" required />
      <BaseSelect v-model="role" :label="t('TEST_LOGIN.ROLE_LABEL')" :options="roleOptions" />
      <p v-if="errorMessage" class="text-sm text-danger" role="alert">{{ errorMessage }}</p>
      <BaseButton type="submit" :busy="isBusy">{{ t('TEST_LOGIN.SUBMIT') }}</BaseButton>
    </form>
  </div>
</template>
