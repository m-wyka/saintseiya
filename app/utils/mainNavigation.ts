import { routes } from '#shared/utils/routes';
import type { IconName } from './icons';

export interface MainNavigationItem {
  labelKey: string;
  to: string;
  icon: IconName;
  matchesExactly?: boolean;
}

export const MAIN_NAVIGATION: MainNavigationItem[] = [
  { labelKey: 'GENERAL.HOME', to: routes.home(), icon: 'home', matchesExactly: true },
  { labelKey: 'GENERAL.FORUM', to: routes.forumIndex(), icon: 'forum' },
  { labelKey: 'GENERAL.GALLERY', to: routes.gallery(), icon: 'image' },
  { labelKey: 'GENERAL.VIDEO', to: routes.videos(), icon: 'play' },
  { labelKey: 'GENERAL.MAPS', to: routes.maps(), icon: 'map' },
];
