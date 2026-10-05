export interface AdminTab {
  labelKey: string;
  to: string;
}

export const VIDEO_ADMIN_TABS: AdminTab[] = [
  { labelKey: 'ADMIN_NAV.VIDEOS', to: '/admin/video' },
  { labelKey: 'ADMIN_NAV.CATEGORIES', to: '/admin/video/kategorie' },
];

export const LINK_ADMIN_TABS: AdminTab[] = [
  { labelKey: 'ADMIN_NAV.LINKS', to: '/admin/linki' },
  { labelKey: 'ADMIN_NAV.CATEGORIES', to: '/admin/linki/kategorie' },
];

export const FORUM_ADMIN_TABS: AdminTab[] = [
  { labelKey: 'ADMIN_NAV.FORUM_SECTIONS', to: '/admin/forum' },
  { labelKey: 'ADMIN_NAV.CATEGORIES', to: '/admin/forum/kategorie' },
];
