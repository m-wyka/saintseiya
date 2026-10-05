export const MEDIA_BASE_URL = '/media';
export const LEGACY_MEDIA_FOLDER = 'legacy';
export const THUMBNAILS_MEDIA_FOLDER = 'thumbnails';

export const RESERVED_ROOT_SEGMENTS = [
  'account',
  'admin',
  'ankiety',
  'api',
  'auth',
  'downloads',
  'en',
  'forum',
  'galeria',
  'gallery',
  'konto',
  'linki',
  'links',
  'logowanie-testowe',
  'mapy',
  'maps',
  'media',
  'news',
  'newsy',
  'pliki',
  'polls',
  'search',
  'shoutbox',
  'szukaj',
  'tagi',
  'tags',
  'test-login',
  'theme',
  'user',
  'uzytkownik',
  'video',
] as const;

export const PAGE_FILE_SEGMENT_URLS: Record<string, string> = {
  account: 'konto',
  categories: 'kategorie',
  category: 'kategoria',
  comments: 'komentarze',
  downloads: 'pliki',
  gallery: 'galeria',
  images: 'obrazki',
  links: 'linki',
  maps: 'mapy',
  navigation: 'nawigacja',
  'new-thread': 'nowy-temat',
  news: 'newsy',
  pages: 'strony',
  photo: 'zdjecie',
  polls: 'ankiety',
  search: 'szukaj',
  section: 'dzial',
  settings: 'ustawienia',
  tags: 'tagi',
  'test-login': 'logowanie-testowe',
  thread: 'temat',
  user: 'uzytkownik',
  users: 'uzytkownicy',
};

export const localizePagePath = (filePath: string): string =>
  filePath
    .split('/')
    .map((segment) => PAGE_FILE_SEGMENT_URLS[segment] ?? segment)
    .join('/');

const PAGE_URL_SEGMENT_FILES = Object.fromEntries(
  Object.entries(PAGE_FILE_SEGMENT_URLS).map(([fileSegment, urlSegment]) => [urlSegment, fileSegment]),
);

export const englishPagePath = (polishPath: string): string =>
  polishPath
    .split('/')
    .map((segment) => PAGE_URL_SEGMENT_FILES[segment] ?? segment)
    .join('/');

export const routes = {
  home: () => '/',
  newsList: () => '/newsy',
  news: (slug: string) => `/newsy/${slug}`,
  newsCategory: (slug: string) => `/newsy/kategoria/${slug}`,
  tag: (slug: string) => `/tagi/${slug}`,
  page: (path: string) => `/${path}`,
  forumIndex: () => '/forum',
  forum: (slug: string) => `/forum/dzial/${slug}`,
  thread: (id: number) => `/forum/temat/${id}`,
  post: (id: number) => `/forum/post/${id}`,
  gallery: () => '/galeria',
  album: (slug: string) => `/galeria/${slug}`,
  photo: (id: number) => `/galeria/zdjecie/${id}`,
  videos: () => '/video',
  videoCategory: (slug: string) => `/video/${slug}`,
  maps: () => '/mapy',
  map: (slug: string) => `/mapy/${slug}`,
  links: () => '/linki',
  downloads: () => '/pliki',
  polls: () => '/ankiety',
  shoutbox: () => '/shoutbox',
  search: () => '/szukaj',
  user: (id: number) => `/uzytkownik/${id}`,
  media: (storedPath: string) => `${MEDIA_BASE_URL}/${storedPath.split('/').map(encodeURIComponent).join('/')}`,
};
