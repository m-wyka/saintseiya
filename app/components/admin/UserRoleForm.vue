<script setup lang="ts">
import { MODERATOR_PERMISSION_LABELS, MODERATOR_PERMISSIONS, USER_ROLE_LABELS, USER_ROLES } from '#shared/utils/roles';
import type { ModeratorPermission, UserRole } from '#shared/utils/roles';

interface RoleHolder {
  id: number;
  name: string;
  role: UserRole;
  permissions: ModeratorPermission[];
}

const props = defineProps<{ account: RoleHolder }>();
const emit = defineEmits<{ saved: []; cancel: [] }>();

const ROLE_OPTIONS = USER_ROLES.map((role) => ({ value: role, label: USER_ROLE_LABELS[role] }));

const role = ref<UserRole>(props.account.role);
const permissions = ref<ModeratorPermission[]>([...props.account.permissions]);
const { isBusy, errorMessage, run } = useApiAction();

const togglePermission = (permission: ModeratorPermission) => {
  permissions.value = permissions.value.includes(permission)
    ? permissions.value.filter((granted) => granted !== permission)
    : [...permissions.value, permission];
};

const save = async () => {
  const wasSaved = await run(() =>
    apiRequest(`/api/admin/users/${props.account.id}/role`, {
      method: 'PATCH',
      body: { role: role.value, permissions: permissions.value },
    }),
  );
  if (wasSaved) {
    emit('saved');
  }
};
</script>

<template>
  <form class="mb-6 flex animate-rise flex-col gap-4 panel p-5" @submit.prevent="save">
    <h2 class="heading-display text-lg text-gold-300">Rola i uprawnienia: {{ account.name }}</h2>
    <BaseSelect v-model="role" label="Rola" :options="ROLE_OPTIONS" class="max-w-xs" />
    <fieldset v-if="role === 'moderator'" class="flex flex-col gap-2">
      <legend class="mb-2 text-xs font-semibold tracking-wide text-aqua-300 uppercase">Uprawnienia moderatora</legend>
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <BaseCheckbox
          v-for="permission in MODERATOR_PERMISSIONS"
          :key="permission"
          :model-value="permissions.includes(permission)"
          :label="MODERATOR_PERMISSION_LABELS[permission]"
          @update:model-value="togglePermission(permission)"
        />
      </div>
    </fieldset>
    <p v-else-if="role === 'admin'" class="text-sm text-aqua-300">
      Administrator ma dostęp do wszystkich działów panelu.
    </p>
    <p class="text-xs text-aqua-500">
      Zmiana obowiązuje od razu. Menu panelu u tej osoby odświeży się przy najbliższym wczytaniu strony.
    </p>
    <p v-if="errorMessage" class="flex items-center gap-2 text-sm text-danger" role="alert">
      <AppIcon name="warning" />
      {{ errorMessage }}
    </p>
    <div class="flex flex-wrap gap-2">
      <BaseButton type="submit" :busy="isBusy">
        <AppIcon name="check" />
        Zapisz
      </BaseButton>
      <BaseButton variant="ghost" @click="emit('cancel')">Anuluj</BaseButton>
    </div>
  </form>
</template>
