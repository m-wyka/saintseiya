import type { AdminResource } from '../../utils/adminResource';
import { downloadsResource } from '../directory/downloads';
import { linkCategoriesResource } from '../directory/linkCategories';
import { linksResource } from '../directory/links';
import { navigationLinksResource } from '../directory/navigationLinks';
import { navigationSectionsResource } from '../directory/navigationSections';
import { pollsResource } from '../directory/polls';
import { videoCategoriesResource } from '../directory/videoCategories';
import { videosResource } from '../directory/videos';

export const directoryResources: Record<string, AdminResource> = {
  'video-categories': videoCategoriesResource,
  videos: videosResource,
  'link-categories': linkCategoriesResource,
  links: linksResource,
  downloads: downloadsResource,
  polls: pollsResource,
  'navigation-sections': navigationSectionsResource,
  'navigation-links': navigationLinksResource,
};
