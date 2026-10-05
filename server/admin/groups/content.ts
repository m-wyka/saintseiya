import type { AdminResource } from '../../utils/adminResource';
import { albumsResource } from '../content/albums';
import { pagesResource } from '../content/pages';

export const contentResources: Record<string, AdminResource> = {
  pages: pagesResource,
  albums: albumsResource,
};
