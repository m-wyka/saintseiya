<script setup lang="ts">
import { userRoleLabelKey } from '#shared/utils/roles';
import { routes } from '#shared/utils/routes';
import { ADMIN_HOME } from '~/utils/adminNavigation';

const ITEM_CLASSES =
  'flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-aqua-200 transition duration-150 hover:bg-white/5 hover:text-gold-300';

const { loggedIn, user, clear } = useUserSession();
const { t } = useI18n();
const localePath = useLocalePath();

const account = computed(() => (loggedIn.value ? user.value : null));
const initials = computed(() => (account.value ? initialsOf(account.value.name) : ''));

const signOut = async (closeMenu: () => void) => {
  closeMenu();
  await clear();
  await navigateTo(localePath(routes.home()));
};
</script>

<template>
  <BaseDropdown v-if="account" class="[&>button]:rounded-full [&>button]:pr-3 [&>button]:pl-2">
    <template #trigger="{ isOpen }">
      <span
        class="flex size-7 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-gold-300 to-cosmo-600 font-display text-[0.7rem] leading-none font-bold text-abyss-950"
        aria-hidden="true"
      >
        {{ initials }}
      </span>
      <span class="max-w-32 truncate text-xs font-semibold max-sm:sr-only">{{ account.name }}</span>
      <AppIcon
        name="chevronDown"
        class="text-xs transition-[rotate] duration-200 ease-cosmo"
        :class="{ 'rotate-180': isOpen }"
      />
    </template>

    <template #default="{ close }">
      <div class="px-2.5 pt-1 pb-2">
        <p class="truncate text-sm font-semibold text-gold-300">{{ account.name }}</p>
        <p class="text-xs text-aqua-500">{{ t(userRoleLabelKey(account.role)) }}</p>
      </div>
      <ul class="border-t border-white/10 py-1">
        <li>
          <NuxtLinkLocale :to="routes.user(account.id)" :class="ITEM_CLASSES">
            <AppIcon name="user" />
            {{ t('LAYOUT.PROFILE') }}
          </NuxtLinkLocale>
        </li>
        <li>
          <NuxtLinkLocale :to="routes.account()" :class="ITEM_CLASSES">
            <AppIcon name="settings" />
            {{ t('LAYOUT.YOUR_ACCOUNT') }}
          </NuxtLinkLocale>
        </li>
        <li v-if="account.role !== 'user'">
          <NuxtLinkLocale :to="ADMIN_HOME" :class="ITEM_CLASSES">
            <AppIcon name="chart" />
            {{ t('LAYOUT.PANEL') }}
          </NuxtLinkLocale>
        </li>
      </ul>
      <div class="border-t border-white/10 pt-1">
        <button type="button" :class="ITEM_CLASSES" @click="signOut(close)">
          <AppIcon name="logout" />
          {{ t('LAYOUT.SIGN_OUT') }}
        </button>
      </div>
    </template>
  </BaseDropdown>

  <a
    v-else
    href="/auth/google"
    class="flex items-center gap-2 rounded-full pr-3 pl-2 text-aqua-200 transition duration-200 ease-cosmo select-none hover:bg-white/5 hover:text-gold-300 active:scale-[0.97]"
    :aria-label="t('LAYOUT.SIGN_IN_WITH_GOOGLE')"
    :title="t('LAYOUT.SIGN_IN_WITH_GOOGLE')"
  >
    <span
      class="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/5 text-aqua-300 ring-1 ring-white/15"
      aria-hidden="true"
    >
      <AppIcon name="user" class="text-sm" />
    </span>
    <span class="text-xs font-semibold max-sm:hidden">{{ t('LAYOUT.SIGN_IN') }}</span>
  </a>
</template>
