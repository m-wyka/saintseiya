export const USER_ROLES = ['user', 'moderator', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const MODERATOR_PERMISSIONS = [
  'news',
  'pages',
  'maps',
  'gallery',
  'videos',
  'forum',
  'comments',
  'shoutbox',
  'polls',
  'links',
  'downloads',
  'users',
] as const;
export type ModeratorPermission = (typeof MODERATOR_PERMISSIONS)[number];

export type AdminAccess = ModeratorPermission | 'admin' | 'staff';

export const userRoleLabelKey = (role: UserRole): string => `GENERAL.ROLE_${role.toUpperCase()}`;

export const moderatorPermissionLabelKey = (permission: ModeratorPermission): string =>
  `PERMISSIONS.${permission.toUpperCase()}`;

interface StaffIdentity {
  role: UserRole;
  permissions: readonly ModeratorPermission[];
}

export const isStaff = (identity: StaffIdentity | null | undefined): boolean =>
  identity?.role === 'admin' || identity?.role === 'moderator';

export const hasPermission = (identity: StaffIdentity | null | undefined, permission: ModeratorPermission): boolean => {
  if (!identity) {
    return false;
  }
  if (identity.role === 'admin') {
    return true;
  }
  return identity.role === 'moderator' && identity.permissions.includes(permission);
};

export const canAccess = (identity: StaffIdentity | null | undefined, access: AdminAccess): boolean => {
  if (!identity) {
    return false;
  }
  if (access === 'staff') {
    return isStaff(identity);
  }
  return access === 'admin' ? identity.role === 'admin' : hasPermission(identity, access);
};
