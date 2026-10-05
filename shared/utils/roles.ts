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

export const MODERATOR_PERMISSION_LABELS: Record<ModeratorPermission, string> = {
  news: 'Newsy, kategorie i tagi',
  pages: 'Podstrony',
  maps: 'Mapy interaktywne',
  gallery: 'Galeria zdjęć',
  videos: 'Galeria video',
  forum: 'Moderacja forum',
  comments: 'Moderacja komentarzy',
  shoutbox: 'Moderacja shoutboxa',
  polls: 'Ankiety',
  links: 'Katalog linków',
  downloads: 'Pliki do pobrania',
  users: 'Blokowanie użytkowników',
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  user: 'Użytkownik',
  moderator: 'Moderator',
  admin: 'Administrator',
};

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
