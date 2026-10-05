<script setup lang="ts">
import { moderatorPermissionLabelKey, userRoleLabelKey } from '#shared/utils/roles';
import type { ModeratorPermission, UserRole } from '#shared/utils/roles';

definePageMeta({ layout: 'admin' });

interface UserRow {
  id: number;
  name: string;
  email: string | null;
  role: UserRole;
  permissions: ModeratorPermission[];
  isGhost: boolean;
  bannedAt: string | null;
  lastSeenAt: string | null;
  createdAt: string;
}

const { t } = useI18n();

const statusFilters = computed(() => [
  { value: '', label: t('ADMIN_USERS.FILTER_ALL') },
  { value: 'active', label: t('ADMIN_USERS.FILTER_ACTIVE') },
  { value: 'banned', label: t('ADMIN_USERS.FILTER_BANNED') },
  { value: 'ghosts', label: t('ADMIN_USERS.FILTER_GHOSTS') },
]);

const { user: viewer } = useUserSession();
const { rows, page, pageCount, total, search, filter, isLoading, refresh } = useAdminList<UserRow>('users');
const moderate = useModerationAction();
const toasts = useToastStore();

const isAdministrator = computed(() => viewer.value?.role === 'admin');
const columns = computed(() => [
  { key: 'name', label: t('ADMIN_USERS.NICKNAME') },
  { key: 'role', label: t('ADMIN_USERS.ROLE') },
  ...(isAdministrator.value ? [{ key: 'email', label: t('ADMIN_USERS.EMAIL') }] : []),
  { key: 'createdAt', label: t('ADMIN_USERS.MEMBER_SINCE') },
  { key: 'lastSeenAt', label: t('ADMIN_USERS.LAST_SEEN') },
  { key: 'status', label: t('GENERAL.STATUS') },
]);

const isOwnAccount = (account: UserRow) => account.id === viewer.value?.id;
const canBan = (account: UserRow) =>
  !account.isGhost && !isOwnAccount(account) && (account.role !== 'admin' || isAdministrator.value);
const canChangeRole = (account: UserRow) => isAdministrator.value && !account.isGhost && !isOwnAccount(account);
const permissionLabels = (account: UserRow) =>
  account.permissions.map((permission) => t(moderatorPermissionLabelKey(permission))).join(', ');

const setBanned = async (account: UserRow, isBanned: boolean) => {
  const wasChanged = await moderate(
    () => apiRequest(`/api/admin/users/${account.id}/ban`, { method: 'PATCH', body: { isBanned } }),
    isBanned ? t('ADMIN_USERS.ACCOUNT_BANNED') : t('ADMIN_USERS.ACCOUNT_UNBANNED'),
  );
  if (wasChanged) {
    await refresh();
  }
};

const roleEditedAccount = ref<UserRow | null>(null);

const onRoleSaved = async () => {
  roleEditedAccount.value = null;
  toasts.success(t('ADMIN_USERS.ROLE_SAVED'));
  await refresh();
};

useSeoMeta({ title: () => t('ADMIN_NAV.USERS') });
</script>

<template>
  <div>
    <AdminHeader
      :title="t('ADMIN_NAV.USERS')"
      :subtitle="t('ADMIN_USERS.ACCOUNT_COUNT', { count: formatNumber(total) }, total)"
    >
      <BaseInput
        v-model="search"
        type="search"
        :label="t('GENERAL.SEARCH')"
        :placeholder="t('ADMIN_USERS.SEARCH_PLACEHOLDER')"
        hide-label
        class="w-56"
      />
      <BaseSelect v-model="filter" :label="t('GENERAL.STATUS')" :options="statusFilters" hide-label class="w-44" />
    </AdminHeader>

    <UserRoleForm
      v-if="roleEditedAccount"
      :key="roleEditedAccount.id"
      :account="roleEditedAccount"
      @saved="onRoleSaved"
      @cancel="roleEditedAccount = null"
    />

    <AdminTable :columns="columns" :rows="rows" :is-loading="isLoading" :empty-message="t('ADMIN_USERS.EMPTY')">
      <template #cell-name="{ row }">
        <span class="font-semibold" :class="row.isGhost ? 'text-aqua-300' : 'text-gold-300'">{{ row.name }}</span>
        <span v-if="isOwnAccount(row)" class="ml-1.5 text-xs text-aqua-500">{{ t('ADMIN_USERS.OWN_ACCOUNT') }}</span>
      </template>
      <template #cell-role="{ row }">
        {{ t(userRoleLabelKey(row.role)) }}
        <span v-if="row.role === 'moderator'" class="block max-w-xs text-xs text-aqua-500">
          {{ permissionLabels(row) || t('ADMIN_USERS.NO_PERMISSIONS') }}
        </span>
      </template>
      <template #cell-createdAt="{ row }">
        <template v-if="row.isGhost">—</template>
        <time v-else :datetime="row.createdAt" class="whitespace-nowrap">{{ formatLongDate(row.createdAt) }}</time>
      </template>
      <template #cell-lastSeenAt="{ row }">
        <time v-if="row.lastSeenAt" :datetime="row.lastSeenAt" class="whitespace-nowrap">
          {{ formatDateTime(row.lastSeenAt) }}
        </time>
        <template v-else>—</template>
      </template>
      <template #cell-status="{ row }">
        <StateBadge v-if="row.isGhost" :label="t('GENERAL.DELETED_ACCOUNT')" icon="user" tone="muted" />
        <StateBadge v-else-if="row.bannedAt" :label="t('ADMIN_USERS.ACCOUNT_BANNED')" icon="lock" tone="danger" />
        <StateBadge v-else :label="t('ADMIN_USERS.ACCOUNT_ACTIVE')" icon="check" tone="positive" />
      </template>
      <template #actions="{ row }">
        <BaseButton v-if="canChangeRole(row)" variant="ghost" size="sm" @click="roleEditedAccount = row">
          <AppIcon name="settings" />
          {{ t('ADMIN_USERS.ROLE') }}
        </BaseButton>
        <template v-if="canBan(row)">
          <BaseButton v-if="row.bannedAt" variant="ghost" size="sm" @click="setBanned(row, false)">
            <AppIcon name="check" />
            {{ t('ADMIN_USERS.UNBAN') }}
          </BaseButton>
          <BaseButton v-else variant="ghost" size="sm" @click="setBanned(row, true)">
            <AppIcon name="lock" />
            {{ t('ADMIN_USERS.BAN') }}
          </BaseButton>
        </template>
      </template>
    </AdminTable>
    <PageStepper v-model="page" :page-count="pageCount" />
  </div>
</template>
