import type { AdminAccess } from '#shared/utils/roles';
import type { IconName } from './icons';

export interface AdminNavigationItem {
  labelKey: string;
  to: string;
  icon: IconName;
  access: AdminAccess;
}

interface AdminNavigationGroup {
  titleKey: string;
  items: AdminNavigationItem[];
}

export const ADMIN_HOME = '/admin';

export const ADMIN_NAVIGATION: AdminNavigationGroup[] = [
  {
    titleKey: 'ADMIN_NAV.GROUP_OVERVIEW',
    items: [{ labelKey: 'ADMIN_NAV.DASHBOARD', to: ADMIN_HOME, icon: 'chart', access: 'staff' }],
  },
  {
    titleKey: 'ADMIN_NAV.GROUP_CONTENT',
    items: [
      { labelKey: 'ADMIN_NAV.NEWS', to: '/admin/newsy', icon: 'star', access: 'news' },
      { labelKey: 'ADMIN_NAV.NEWS_CATEGORIES', to: '/admin/kategorie', icon: 'folder', access: 'news' },
      { labelKey: 'ADMIN_NAV.TAGS', to: '/admin/tagi', icon: 'tag', access: 'news' },
      { labelKey: 'ADMIN_NAV.PAGES', to: '/admin/strony', icon: 'list', access: 'pages' },
      { labelKey: 'ADMIN_NAV.MAPS', to: '/admin/mapy', icon: 'map', access: 'maps' },
      { labelKey: 'ADMIN_NAV.IMAGES', to: '/admin/obrazki', icon: 'image', access: 'staff' },
    ],
  },
  {
    titleKey: 'ADMIN_NAV.GROUP_MULTIMEDIA',
    items: [
      { labelKey: 'ADMIN_NAV.GALLERY', to: '/admin/galeria', icon: 'image', access: 'gallery' },
      { labelKey: 'ADMIN_NAV.VIDEO', to: '/admin/video', icon: 'play', access: 'videos' },
      { labelKey: 'ADMIN_NAV.DOWNLOADS', to: '/admin/pliki', icon: 'download', access: 'downloads' },
      { labelKey: 'ADMIN_NAV.LINKS', to: '/admin/linki', icon: 'link', access: 'links' },
    ],
  },
  {
    titleKey: 'ADMIN_NAV.GROUP_COMMUNITY',
    items: [
      { labelKey: 'ADMIN_NAV.FORUM', to: '/admin/forum', icon: 'forum', access: 'forum' },
      { labelKey: 'ADMIN_NAV.COMMENTS', to: '/admin/komentarze', icon: 'comment', access: 'comments' },
      { labelKey: 'ADMIN_NAV.SHOUTBOX', to: '/admin/shoutbox', icon: 'send', access: 'shoutbox' },
      { labelKey: 'ADMIN_NAV.POLLS', to: '/admin/ankiety', icon: 'check', access: 'polls' },
      { labelKey: 'ADMIN_NAV.USERS', to: '/admin/uzytkownicy', icon: 'user', access: 'users' },
    ],
  },
  {
    titleKey: 'ADMIN_NAV.GROUP_PORTAL',
    items: [
      { labelKey: 'ADMIN_NAV.NAVIGATION', to: '/admin/nawigacja', icon: 'menu', access: 'admin' },
      { labelKey: 'ADMIN_NAV.SETTINGS', to: '/admin/ustawienia', icon: 'settings', access: 'admin' },
    ],
  },
];

export const adminItemFor = (path: string): AdminNavigationItem | undefined =>
  ADMIN_NAVIGATION.flatMap((group) => group.items)
    .filter((item) =>
      item.to === ADMIN_HOME ? path === ADMIN_HOME : path === item.to || path.startsWith(`${item.to}/`),
    )
    .sort((first, second) => second.to.length - first.to.length)[0];
