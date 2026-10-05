<script setup lang="ts">
import { GHOST_USER_CAPTION } from '#shared/utils/content';
import { MODERATOR_PERMISSION_LABELS, USER_ROLE_LABELS } from '#shared/utils/roles';
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

const STATUS_FILTERS = [
  { value: '', label: 'Wszyscy' },
  { value: 'active', label: 'Aktywni' },
  { value: 'banned', label: 'Zablokowani' },
  { value: 'ghosts', label: 'Konta usunięte' },
];

const { user: viewer } = useUserSession();
const { rows, page, pageCount, total, search, filter, isLoading, refresh } = useAdminList<UserRow>('users');
const moderate = useModerationAction();
const toasts = useToastStore();

const isAdministrator = computed(() => viewer.value?.role === 'admin');
const columns = computed(() => [
  { key: 'name', label: 'Nick' },
  { key: 'role', label: 'Rola' },
  ...(isAdministrator.value ? [{ key: 'email', label: 'E-mail' }] : []),
  { key: 'createdAt', label: 'Na portalu od' },
  { key: 'lastSeenAt', label: 'Ostatnia wizyta' },
  { key: 'status', label: 'Status' },
]);

const isOwnAccount = (account: UserRow) => account.id === viewer.value?.id;
const canBan = (account: UserRow) =>
  !account.isGhost && !isOwnAccount(account) && (account.role !== 'admin' || isAdministrator.value);
const canChangeRole = (account: UserRow) => isAdministrator.value && !account.isGhost && !isOwnAccount(account);
const permissionLabels = (account: UserRow) =>
  account.permissions.map((permission) => MODERATOR_PERMISSION_LABELS[permission]).join(', ');

const setBanned = async (account: UserRow, isBanned: boolean) => {
  const wasChanged = await moderate(
    () => apiRequest(`/api/admin/users/${account.id}/ban`, { method: 'PATCH', body: { isBanned } }),
    isBanned ? 'Konto zablokowane' : 'Konto odblokowane',
  );
  if (wasChanged) {
    await refresh();
  }
};

const roleEditedAccount = ref<UserRow | null>(null);

const onRoleSaved = async () => {
  roleEditedAccount.value = null;
  toasts.success('Rola zapisana');
  await refresh();
};

useSeoMeta({ title: 'Użytkownicy' });
</script>

<template>
  <div>
    <AdminHeader title="Użytkownicy" :subtitle="pluralize(total, 'konto', 'konta', 'kont')">
      <BaseInput v-model="search" type="search" label="Szukaj" placeholder="Szukaj po nicku…" hide-label class="w-56" />
      <BaseSelect v-model="filter" label="Status" :options="STATUS_FILTERS" hide-label class="w-44" />
    </AdminHeader>

    <UserRoleForm
      v-if="roleEditedAccount"
      :key="roleEditedAccount.id"
      :account="roleEditedAccount"
      @saved="onRoleSaved"
      @cancel="roleEditedAccount = null"
    />

    <AdminTable :columns="columns" :rows="rows" :is-loading="isLoading" empty-message="Brak kont do wyświetlenia.">
      <template #cell-name="{ row }">
        <span class="font-semibold" :class="row.isGhost ? 'text-aqua-300' : 'text-gold-300'">{{ row.name }}</span>
        <span v-if="isOwnAccount(row)" class="ml-1.5 text-xs text-aqua-500">(to Ty)</span>
      </template>
      <template #cell-role="{ row }">
        {{ USER_ROLE_LABELS[row.role] }}
        <span v-if="row.role === 'moderator'" class="block max-w-xs text-xs text-aqua-500">
          {{ permissionLabels(row) || 'Bez uprawnień' }}
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
        <StateBadge v-if="row.isGhost" :label="GHOST_USER_CAPTION" icon="user" tone="muted" />
        <StateBadge v-else-if="row.bannedAt" label="Konto zablokowane" icon="lock" tone="danger" />
        <StateBadge v-else label="Konto aktywne" icon="check" tone="positive" />
      </template>
      <template #actions="{ row }">
        <BaseButton v-if="canChangeRole(row)" variant="ghost" size="sm" @click="roleEditedAccount = row">
          <AppIcon name="settings" />
          Rola
        </BaseButton>
        <template v-if="canBan(row)">
          <BaseButton v-if="row.bannedAt" variant="ghost" size="sm" @click="setBanned(row, false)">
            <AppIcon name="check" />
            Odblokuj
          </BaseButton>
          <BaseButton v-else variant="ghost" size="sm" @click="setBanned(row, true)">
            <AppIcon name="lock" />
            Zablokuj
          </BaseButton>
        </template>
      </template>
    </AdminTable>
    <PageStepper v-model="page" :page-count="pageCount" />
  </div>
</template>
