<script setup lang="ts">
const { loggedIn, user, clear } = useUserSession();
const { t } = useI18n();
const localePath = useLocalePath();

const signOut = async () => {
  await clear();
  await navigateTo(localePath('/'));
};
</script>

<template>
  <div class="flex items-center gap-2">
    <template v-if="loggedIn && user">
      <NuxtLinkLocale
        to="/konto"
        class="flex items-center gap-2 text-gold-300 transition hover:text-cosmo-400"
        :title="t('LAYOUT.YOUR_ACCOUNT')"
      >
        <img
          v-if="user.avatarUrl"
          :src="user.avatarUrl"
          alt=""
          class="size-6 rounded-full"
          referrerpolicy="no-referrer"
        />
        <AppIcon v-else name="user" />
        <span class="max-w-40 truncate font-semibold">{{ user.name }}</span>
      </NuxtLinkLocale>
      <BaseButton v-if="user.role !== 'user'" to="/admin" variant="secondary" size="sm">
        <AppIcon name="settings" />
        <span class="max-sm:sr-only">{{ t('LAYOUT.PANEL') }}</span>
      </BaseButton>
      <BaseButton variant="ghost" size="sm" @click="signOut">
        <AppIcon name="logout" />
        <span class="max-sm:sr-only">{{ t('LAYOUT.SIGN_OUT') }}</span>
      </BaseButton>
    </template>
    <LoginLink v-else />
  </div>
</template>
