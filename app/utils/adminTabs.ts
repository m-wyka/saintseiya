export interface AdminTab {
  label: string;
  to: string;
}

export const VIDEO_ADMIN_TABS: AdminTab[] = [
  { label: 'Filmy', to: '/admin/video' },
  { label: 'Kategorie', to: '/admin/video/kategorie' },
];

export const LINK_ADMIN_TABS: AdminTab[] = [
  { label: 'Linki', to: '/admin/linki' },
  { label: 'Kategorie', to: '/admin/linki/kategorie' },
];

export const FORUM_ADMIN_TABS: AdminTab[] = [
  { label: 'Działy', to: '/admin/forum' },
  { label: 'Kategorie', to: '/admin/forum/kategorie' },
];
