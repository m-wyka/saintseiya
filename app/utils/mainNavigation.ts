import { routes } from '#shared/utils/routes';
import type { IconName } from './icons';

export interface MainNavigationItem {
  label: string;
  to: string;
  icon: IconName;
  matchesExactly?: boolean;
}

export const MAIN_NAVIGATION: MainNavigationItem[] = [
  { label: 'Główna', to: routes.home(), icon: 'home', matchesExactly: true },
  { label: 'Newsy', to: routes.newsList(), icon: 'star' },
  { label: 'Forum', to: routes.forumIndex(), icon: 'forum' },
  { label: 'Galeria', to: routes.gallery(), icon: 'image' },
  { label: 'Video', to: routes.videos(), icon: 'play' },
  { label: 'Mapy', to: routes.maps(), icon: 'map' },
  { label: 'Szukaj', to: routes.search(), icon: 'search' },
];
