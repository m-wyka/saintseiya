import type { AdminResource } from '../../utils/adminResource';
import { forumCategoriesResource } from '../community/forumCategories';
import { forumsResource } from '../community/forums';

export const communityResources: Record<string, AdminResource> = {
  'forum-categories': forumCategoriesResource,
  forums: forumsResource,
};
