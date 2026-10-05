import type { RichHtmlRewriter } from '../../server/utils/html';
import { isLegacySiteUrl, parseLegacyUrl } from '../../shared/utils/legacyUrls';
import type { LegacyTarget } from '../../shared/utils/legacyUrls';
import { routes } from '../../shared/utils/routes';
import type { AssetRegistry } from './assets';

const WEB_URL_PATTERN = /^https?:\/\//i;
const PROTOCOL_RELATIVE_PATTERN = /^\/\//;
const PASS_THROUGH_LINK_PATTERN = /^(?:#|mailto:)/i;

export interface LegacyLookups {
  pagePaths: Map<number, string>;
  newsSlugs: Map<number, string>;
  newsCategorySlugs: Map<number, string>;
  forumSlugs: Map<number, string>;
  threadIds: Map<number, number>;
  postIds: Map<number, number>;
  albumSlugs: Map<number, string>;
  photoIds: Map<number, number>;
  userIds: Map<number, number>;
}

export interface LegacyRewriter extends Required<RichHtmlRewriter> {
  externalImages: Set<string>;
  resolveTarget: (target: LegacyTarget) => string;
}

const found = <Key, Value>(
  lookup: Map<Key, Value>,
  key: Key,
  toUrl: (value: Value) => string,
  fallback: string,
): string => {
  const value = lookup.get(key);
  return value === undefined ? fallback : toUrl(value);
};

export const createLegacyRewriter = (lookups: LegacyLookups, assets: AssetRegistry): LegacyRewriter => {
  const externalImages = new Set<string>();

  const resolveTarget = (target: LegacyTarget): string => {
    switch (target.kind) {
      case 'home':
        return routes.home();
      case 'page':
        return found(lookups.pagePaths, target.legacyId, routes.page, routes.home());
      case 'news':
        return found(lookups.newsSlugs, target.legacyId, routes.news, routes.newsList());
      case 'newsList':
        return routes.newsList();
      case 'newsCategory':
        return found(lookups.newsCategorySlugs, target.legacyId, routes.newsCategory, routes.newsList());
      case 'forumIndex':
        return routes.forumIndex();
      case 'forum':
        return found(lookups.forumSlugs, target.legacyId, routes.forum, routes.forumIndex());
      case 'thread':
        return found(lookups.threadIds, target.legacyId, routes.thread, routes.forumIndex());
      case 'post':
        return found(lookups.postIds, target.legacyId, routes.post, routes.forumIndex());
      case 'gallery':
        return routes.gallery();
      case 'album':
        return found(lookups.albumSlugs, target.legacyId, routes.album, routes.gallery());
      case 'photo':
        return found(lookups.photoIds, target.legacyId, routes.photo, routes.gallery());
      case 'videos':
        return routes.videos();
      case 'user':
        return found(lookups.userIds, target.legacyId, routes.user, routes.home());
      case 'links':
        return routes.links();
      case 'downloads':
        return routes.downloads();
      case 'search':
        return routes.search();
      case 'map':
        return routes.map(target.slug);
      case 'asset':
        return assets.url(target.path);
    }
  };

  const withScheme = (url: string) => (PROTOCOL_RELATIVE_PATTERN.test(url) ? `https:${url}` : url);

  const link = (href: string): string | null => {
    const url = href.trim();
    if (!url) {
      return null;
    }
    if (PASS_THROUGH_LINK_PATTERN.test(url)) {
      return url;
    }
    const target = parseLegacyUrl(url);
    if (target) {
      return resolveTarget(target);
    }
    return isLegacySiteUrl(url) ? routes.home() : withScheme(url);
  };

  const image = (src: string): string | null => {
    const url = withScheme(src.trim());
    const target = parseLegacyUrl(url);
    if (target?.kind === 'asset') {
      return assets.url(target.path);
    }
    if (!WEB_URL_PATTERN.test(url) || isLegacySiteUrl(url)) {
      return null;
    }
    externalImages.add(url);
    return url;
  };

  return { link, image, externalImages, resolveTarget };
};
