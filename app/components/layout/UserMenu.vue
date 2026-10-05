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
  <BaseDropdown class="[&>button]:rounded-full [&>button]:pr-3 [&>button]:pl-2">
    <template #trigger="{ isOpen }">
      <span
        class="flex size-7 shrink-0 items-center justify-center rounded-full font-display text-[0.7rem] leading-none font-bold"
        :class="
          initials
            ? 'bg-linear-to-br from-gold-300 to-cosmo-600 text-abyss-950'
            : 'bg-white/5 text-aqua-300 ring-1 ring-white/15'
        "
        aria-hidden="true"
      >
        <template v-if="initials">{{ initials }}</template>
        <AppIcon v-else name="user" class="text-sm" />
      </span>
      <span class="max-w-32 truncate text-xs font-semibold max-sm:sr-only">
        {{ account?.name ?? t('LAYOUT.SIGN_IN') }}
      </span>
      <AppIcon
        name="chevronDown"
        class="text-xs transition-[rotate] duration-200 ease-cosmo"
        :class="{ 'rotate-180': isOpen }"
      />
    </template>

    <template #default="{ close }">
      <template v-if="account">
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
      </template>

      <div
        class="flex items-center justify-between gap-3 px-2.5 py-2 text-xs"
        :class="{ 'border-t border-white/10': account }"
      >
        <span class="text-sm text-aqua-200" aria-hidden="true">{{ t('GENERAL.LANGUAGE') }}</span>
        <LanguageSwitcher />
      </div>

      <div class="border-t border-white/10 pt-1">
        <button v-if="account" type="button" :class="ITEM_CLASSES" @click="signOut(close)">
          <AppIcon name="logout" />
          {{ t('LAYOUT.SIGN_OUT') }}
        </button>
        <LoginLink v-else class="mt-1 w-full justify-center" />
      </div>
    </template>
  </BaseDropdown>
</template>
