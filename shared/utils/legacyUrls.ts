const LEGACY_HOST_PATTERN = /^(?:https?:)?\/\/(?:www\.)?saintseiya\.netserwer\.pl(?=\/|$)/i;
const ABSOLUTE_URL_PATTERN = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;
const LEGACY_ASSET_PATTERN = /^(?:img|images|downloads|newscenter|mapa|kr|an|slides|thumbs)\/.+\.[a-z0-9]{2,5}$/i;

// The old FAQ sub-page became a module of its own, so no page carries this identifier.
const LEGACY_FAQ_PAGE_ID = 761;

export const LEGACY_MAP_SLUGS = {
  sky: 'mapa-nieba',
  underworld: 'krolestwo-umarlych',
  poseidon: 'krolestwo-posejdona',
  angelology: 'angelologia',
} as const;

export type LegacyTarget =
  | { kind: 'home' }
  | { kind: 'page'; legacyId: number }
  | { kind: 'faq' }
  | { kind: 'news'; legacyId: number }
  | { kind: 'newsList' }
  | { kind: 'newsCategory'; legacyId: number }
  | { kind: 'forumIndex' }
  | { kind: 'forum'; legacyId: number }
  | { kind: 'thread'; legacyId: number }
  | { kind: 'post'; legacyId: number }
  | { kind: 'gallery' }
  | { kind: 'album'; legacyId: number }
  | { kind: 'photo'; legacyId: number }
  | { kind: 'videos' }
  | { kind: 'user'; legacyId: number }
  | { kind: 'links' }
  | { kind: 'downloads' }
  | { kind: 'search' }
  | { kind: 'map'; slug: string }
  | { kind: 'asset'; path: string };

const numericParam = (query: URLSearchParams, name: string): number | null => {
  const value = Number(query.get(name));
  return Number.isInteger(value) && value > 0 ? value : null;
};

const withId = <Kind extends string>(kind: Kind, legacyId: number | null, fallback: LegacyTarget) =>
  legacyId === null ? fallback : ({ kind, legacyId } as { kind: Kind; legacyId: number });

const SCRIPT_TARGETS: Record<string, (query: URLSearchParams) => LegacyTarget> = {
  '': () => ({ kind: 'home' }),
  'index.php': () => ({ kind: 'home' }),
  'news.php': (query) => withId('news', numericParam(query, 'readmore'), { kind: 'home' }),
  'news_cats.php': (query) => withId('newsCategory', numericParam(query, 'cat_id'), { kind: 'newsList' }),
  'viewpage.php': (query) => {
    const pageId = numericParam(query, 'page_id');
    return pageId === LEGACY_FAQ_PAGE_ID ? { kind: 'faq' } : withId('page', pageId, { kind: 'home' });
  },
  forum: () => ({ kind: 'forumIndex' }),
  'forum/index.php': () => ({ kind: 'forumIndex' }),
  'forum/viewforum.php': (query) => withId('forum', numericParam(query, 'forum_id'), { kind: 'forumIndex' }),
  'forum/viewthread.php': (query) =>
    withId(
      'post',
      numericParam(query, 'pid'),
      withId('thread', numericParam(query, 'thread_id'), { kind: 'forumIndex' }),
    ),
  'photogallery.php': (query) =>
    withId(
      'photo',
      numericParam(query, 'photo_id'),
      withId('album', numericParam(query, 'album_id'), { kind: 'gallery' }),
    ),
  'infusions/fusion_tube/videos.php': () => ({ kind: 'videos' }),
  'profile.php': (query) => withId('user', numericParam(query, 'lookup'), { kind: 'home' }),
  'weblinks.php': () => ({ kind: 'links' }),
  'downloads.php': () => ({ kind: 'downloads' }),
  'search.php': () => ({ kind: 'search' }),
  mapa: () => ({ kind: 'map', slug: LEGACY_MAP_SLUGS.sky }),
  'mapa/index.html': () => ({ kind: 'map', slug: LEGACY_MAP_SLUGS.sky }),
  kr: () => ({ kind: 'map', slug: LEGACY_MAP_SLUGS.underworld }),
  'kr/index.html': () => ({ kind: 'map', slug: LEGACY_MAP_SLUGS.underworld }),
  'posejdon.html': () => ({ kind: 'map', slug: LEGACY_MAP_SLUGS.poseidon }),
};

const safeDecode = (text: string): string => {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
};

const normalizeLegacyPath = (path: string): string =>
  path
    .replace(/^(?:\.{0,2}\/)+/, '')
    .replace(/\/{2,}/g, '/')
    .replace(/\/$/, '');

export const isLegacySiteUrl = (url: string): boolean => {
  const trimmed = url.trim();
  return LEGACY_HOST_PATTERN.test(trimmed) || !ABSOLUTE_URL_PATTERN.test(trimmed);
};

export const parseLegacyUrl = (url: string): LegacyTarget | null => {
  const trimmed = url.trim();
  if (!isLegacySiteUrl(trimmed) || trimmed.startsWith('#')) {
    return null;
  }
  const [location = ''] = trimmed.replace(LEGACY_HOST_PATTERN, '').split('#');
  const [rawPath = '', rawQuery = ''] = location.split('?');
  const path = normalizeLegacyPath(rawPath);
  const script = path.toLowerCase();
  if (Object.hasOwn(SCRIPT_TARGETS, script)) {
    return SCRIPT_TARGETS[script]!(new URLSearchParams(rawQuery));
  }
  if (LEGACY_ASSET_PATTERN.test(path)) {
    return { kind: 'asset', path: safeDecode(path) };
  }
  return null;
};
