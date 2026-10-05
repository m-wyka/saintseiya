import type { AdminResource } from '../utils/adminResource';
import { communityResources } from './groups/community';
import { contentResources } from './groups/content';
import { directoryResources } from './groups/directory';
import { mapsResource } from './maps';
import { newsResource } from './news';
import { newsCategoriesResource } from './newsCategories';
import { tagsResource } from './tags';

const ADMIN_RESOURCES: Record<string, AdminResource> = {
  news: newsResource,
  'news-categories': newsCategoriesResource,
  tags: tagsResource,
  maps: mapsResource,
  ...contentResources,
  ...directoryResources,
  ...communityResources,
};

export const adminResourceNamed = (name: string | undefined): AdminResource => {
  if (!name || !Object.hasOwn(ADMIN_RESOURCES, name)) {
    throw createError({ statusCode: 404, statusMessage: 'ERRORS.RESOURCE_NOT_FOUND' });
  }
  return ADMIN_RESOURCES[name]!;
};
