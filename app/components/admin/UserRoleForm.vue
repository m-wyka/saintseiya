<script setup lang="ts">
import { MODERATOR_PERMISSIONS, moderatorPermissionLabelKey, USER_ROLES, userRoleLabelKey } from '#shared/utils/roles';
import type { ModeratorPermission, UserRole } from '#shared/utils/roles';

interface RoleHolder {
  id: number;
  name: string;
  role: UserRole;
  permissions: ModeratorPermission[];
}

const props = defineProps<{ account: RoleHolder }>();
const emit = defineEmits<{ saved: []; cancel: [] }>();

const { t } = useI18n();

const roleOptions = computed(() => USER_ROLES.map((option) => ({ value: option, label: t(userRoleLabelKey(option)) })));

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
    <h2 class="heading-display text-lg text-gold-300">{{ t('ADMIN_FORMS.ROLE_HEADING', { name: account.name }) }}</h2>
    <BaseSelect v-model="role" :label="t('ADMIN_FORMS.ROLE_LABEL')" :options="roleOptions" class="max-w-xs" />
    <fieldset v-if="role === 'moderator'" class="flex flex-col gap-2">
      <legend class="mb-2 text-xs font-semibold tracking-wide text-aqua-300 uppercase">
        {{ t('ADMIN_FORMS.ROLE_MODERATOR_PERMISSIONS') }}
      </legend>
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <BaseCheckbox
          v-for="permission in MODERATOR_PERMISSIONS"
          :key="permission"
          :model-value="permissions.includes(permission)"
          :label="t(moderatorPermissionLabelKey(permission))"
          @update:model-value="togglePermission(permission)"
        />
      </div>
    </fieldset>
    <p v-else-if="role === 'admin'" class="text-sm text-aqua-300">
      {{ t('ADMIN_FORMS.ROLE_ADMIN_NOTE') }}
    </p>
    <p class="text-xs text-aqua-500">
      {{ t('ADMIN_FORMS.ROLE_CHANGE_NOTE') }}
    </p>
    <p v-if="errorMessage" class="flex items-center gap-2 text-sm text-danger" role="alert">
      <AppIcon name="warning" />
      {{ errorMessage }}
    </p>
    <div class="flex flex-wrap gap-2">
      <BaseButton type="submit" :busy="isBusy">
        <AppIcon name="check" />
        {{ t('GENERAL.SAVE') }}
      </BaseButton>
      <BaseButton variant="ghost" @click="emit('cancel')">{{ t('GENERAL.CANCEL') }}</BaseButton>
    </div>
  </form>
</template>
