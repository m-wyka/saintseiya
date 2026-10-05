import type { AdminAccess } from '#shared/utils/roles';
import type { IconName } from './icons';

export interface AdminNavigationItem {
  label: string;
  to: string;
  icon: IconName;
  access: AdminAccess;
}

interface AdminNavigationGroup {
  title: string;
  items: AdminNavigationItem[];
}

export const ADMIN_HOME = '/admin';

export const ADMIN_NAVIGATION: AdminNavigationGroup[] = [
  { title: 'Przegląd', items: [{ label: 'Dashboard', to: ADMIN_HOME, icon: 'chart', access: 'staff' }] },
  {
    title: 'Treści',
    items: [
      { label: 'Newsy', to: '/admin/newsy', icon: 'star', access: 'news' },
      { label: 'Kategorie newsów', to: '/admin/kategorie', icon: 'folder', access: 'news' },
      { label: 'Tagi', to: '/admin/tagi', icon: 'tag', access: 'news' },
      { label: 'Podstrony', to: '/admin/strony', icon: 'list', access: 'pages' },
      { label: 'Mapy', to: '/admin/mapy', icon: 'map', access: 'maps' },
      { label: 'Obrazki', to: '/admin/obrazki', icon: 'image', access: 'staff' },
    ],
  },
  {
    title: 'Multimedia',
    items: [
      { label: 'Galeria', to: '/admin/galeria', icon: 'image', access: 'gallery' },
      { label: 'Video', to: '/admin/video', icon: 'play', access: 'videos' },
      { label: 'Pliki', to: '/admin/pliki', icon: 'download', access: 'downloads' },
      { label: 'Linki', to: '/admin/linki', icon: 'link', access: 'links' },
    ],
  },
  {
    title: 'Społeczność',
    items: [
      { label: 'Forum', to: '/admin/forum', icon: 'forum', access: 'forum' },
      { label: 'Komentarze', to: '/admin/komentarze', icon: 'comment', access: 'comments' },
      { label: 'Shoutbox', to: '/admin/shoutbox', icon: 'send', access: 'shoutbox' },
      { label: 'Ankiety', to: '/admin/ankiety', icon: 'check', access: 'polls' },
      { label: 'Użytkownicy', to: '/admin/uzytkownicy', icon: 'user', access: 'users' },
    ],
  },
  {
    title: 'Portal',
    items: [
      { label: 'Nawigacja', to: '/admin/nawigacja', icon: 'menu', access: 'admin' },
      { label: 'Ustawienia', to: '/admin/ustawienia', icon: 'settings', access: 'admin' },
    ],
  },
];

export const adminItemFor = (path: string): AdminNavigationItem | undefined =>
  ADMIN_NAVIGATION.flatMap((group) => group.items)
    .filter((item) =>
      item.to === ADMIN_HOME ? path === ADMIN_HOME : path === item.to || path.startsWith(`${item.to}/`),
    )
    .sort((first, second) => second.to.length - first.to.length)[0];
