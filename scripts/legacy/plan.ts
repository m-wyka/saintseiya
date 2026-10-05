import { uniqueSlug } from '../../shared/utils/slug';
import { userNameKey } from '../../shared/utils/users';
import { linkedPageId, planNavigation } from './navigation';
import type { PlannedNavigationSection } from './navigation';
import { isMigratablePage, isPublicPage, planPageTree } from './pageTree';
import type { PlannedPage } from './pageTree';
import type { LegacyData, LegacyForum, LegacyPhoto, LegacyPost, LegacyThread } from './read';
import type { LegacyLookups } from './rewriter';
import { legacyPlainText } from './text';

const NEWS_SLUGS_TAKEN_BY_ROUTES = ['kategoria'];
const FALLBACK_GHOST_NAME = 'Nieznany rycerz';

export interface GhostUser {
  id: number;
  legacyId: number | null;
  name: string;
  nameKey: string;
}

type IdMap = Map<number, number>;
type SlugMap = Map<number, string>;

export interface ImportPlan {
  ghostUsers: GhostUser[];
  fallbackGhostId: number;
  pages: PlannedPage[];
  navigation: PlannedNavigationSection[];
  forumCategories: LegacyForum[];
  forums: LegacyForum[];
  threads: LegacyThread[];
  posts: LegacyPost[];
  photos: LegacyPhoto[];
  ids: {
    users: IdMap;
    newsCategories: IdMap;
    news: IdMap;
    pages: Map<string, number>;
    pagesByLegacyId: IdMap;
    forumCategories: IdMap;
    forums: IdMap;
    threads: IdMap;
    posts: IdMap;
    albums: IdMap;
    photos: IdMap;
    videoCategories: IdMap;
    videos: IdMap;
    polls: IdMap;
    linkCategories: IdMap;
  };
  slugs: {
    newsCategories: SlugMap;
    news: SlugMap;
    forums: SlugMap;
    albums: SlugMap;
    videoCategories: SlugMap;
  };
  lookups: LegacyLookups;
}

const sequentialIds = (rows: { id: number }[]): IdMap => new Map(rows.map((row, index) => [row.id, index + 1]));

const assignSlugs = <Row extends { id: number }>(
  rows: Row[],
  slugSource: (row: Row) => string,
  fallback: string,
  alreadyTaken: string[] = [],
): SlugMap => {
  const taken = new Set(alreadyTaken);
  return new Map(
    rows.map((row) => {
      const slug = uniqueSlug(legacyPlainText(slugSource(row)), (candidate) => taken.has(candidate), fallback);
      taken.add(slug);
      return [row.id, slug];
    }),
  );
};

const numericAuthor = (author: string): number | null => (/^\d+$/.test(author.trim()) ? Number(author) : null);

const contentAuthorIds = (data: LegacyData, threads: LegacyThread[], posts: LegacyPost[]): Set<number> => {
  const ids = [
    ...data.news.map((news) => news.authorId),
    ...threads.flatMap((thread) => [thread.authorId, thread.lastPostAuthorId]),
    ...posts.flatMap((post) => [post.authorId, post.editedById]),
    ...data.comments.map((comment) => numericAuthor(comment.author)),
    ...data.photos.map((photo) => photo.authorId),
    ...data.videos.map((video) => video.authorId),
    ...data.shouts.map((shout) => numericAuthor(shout.author)),
  ];
  return new Set(ids.filter((id): id is number => typeof id === 'number' && id > 0));
};

const planGhostUsers = (data: LegacyData, authorIds: Set<number>): GhostUser[] => {
  const takenKeys = new Set<string>([userNameKey(FALLBACK_GHOST_NAME)]);
  const ghosts = data.users
    .filter((user) => authorIds.has(user.id))
    .map((user, index) => {
      const name = legacyPlainText(user.name) || `Rycerz ${user.id}`;
      const nameKey = takenKeys.has(userNameKey(name)) ? userNameKey(`${name} ${user.id}`) : userNameKey(name);
      takenKeys.add(nameKey);
      return { id: index + 1, legacyId: user.id, name, nameKey };
    });
  return [
    ...ghosts,
    { id: ghosts.length + 1, legacyId: null, name: FALLBACK_GHOST_NAME, nameKey: userNameKey(FALLBACK_GHOST_NAME) },
  ];
};

const linkablePageTitles = (data: LegacyData): Map<number, string> =>
  new Map(
    data.pages.filter((page) => isMigratablePage(page) && isPublicPage(page)).map((page) => [page.id, page.title]),
  );

const navigationRootPageIds = (navigation: PlannedNavigationSection[]): number[] =>
  navigation
    .flatMap((section) => section.links.map((link) => linkedPageId(link.legacyUrl)))
    .filter((id): id is number => id !== null);

const mapValues = <Key, Value, Result>(
  source: Map<Key, Value>,
  convert: (value: Value, key: Key) => Result,
): Map<Key, Result> => new Map([...source].map(([key, value]) => [key, convert(value, key)]));

export const planImport = (data: LegacyData): ImportPlan => {
  const forumCategories = data.forums.filter((forum) => forum.categoryId === 0);
  const categoryIds = new Set(forumCategories.map((category) => category.id));
  const forums = data.forums.filter((forum) => categoryIds.has(forum.categoryId));
  const forumIds = new Set(forums.map((forum) => forum.id));
  const threads = data.threads.filter((thread) => forumIds.has(thread.forumId));
  const threadIds = new Set(threads.map((thread) => thread.id));
  const posts = data.posts.filter((post) => threadIds.has(post.threadId));
  const albumIds = new Set(data.albums.map((album) => album.id));
  const photos = data.photos.filter((photo) => albumIds.has(photo.albumId));

  const ghostUsers = planGhostUsers(data, contentAuthorIds(data, threads, posts));
  const navigation = planNavigation(data.siteLinks, linkablePageTitles(data));
  const pages = planPageTree(data.pages, navigationRootPageIds(navigation));
  const pageIds = new Map(pages.map((page, index) => [page.key, index + 1]));
  const pagesByLegacyId = new Map(
    pages.filter((page) => page.legacyId !== null).map((page) => [page.legacyId!, pageIds.get(page.key)!]),
  );

  const ids = {
    users: new Map(ghostUsers.filter((ghost) => ghost.legacyId !== null).map((ghost) => [ghost.legacyId!, ghost.id])),
    newsCategories: sequentialIds(data.newsCategories),
    news: sequentialIds(data.news),
    pages: pageIds,
    pagesByLegacyId,
    forumCategories: sequentialIds(forumCategories),
    forums: sequentialIds(forums),
    threads: sequentialIds(threads),
    posts: sequentialIds(posts),
    albums: sequentialIds(data.albums),
    photos: sequentialIds(photos),
    videoCategories: sequentialIds(data.videoCategories),
    videos: sequentialIds(data.videos),
    polls: sequentialIds(data.polls),
    linkCategories: sequentialIds(data.linkCategories),
  };

  const slugs = {
    newsCategories: assignSlugs(data.newsCategories, (category) => category.name, 'kategoria'),
    news: assignSlugs(data.news, (news) => news.title, 'news', NEWS_SLUGS_TAKEN_BY_ROUTES),
    forums: assignSlugs(forums, (forum) => forum.name, 'dzial'),
    albums: assignSlugs(data.albums, (album) => album.title, 'album', ['zdjecie']),
    videoCategories: assignSlugs(data.videoCategories, (category) => category.name, 'kategoria'),
  };

  const publishedPagePaths = new Map(
    pages
      .filter((page) => page.legacyId !== null && page.status === 'published')
      .map((page) => [page.legacyId!, page.path]),
  );

  return {
    ghostUsers,
    fallbackGhostId: ghostUsers[ghostUsers.length - 1]!.id,
    pages,
    navigation,
    forumCategories,
    forums,
    threads,
    posts,
    photos,
    ids,
    slugs,
    lookups: {
      pagePaths: publishedPagePaths,
      newsSlugs: slugs.news,
      newsCategorySlugs: slugs.newsCategories,
      forumSlugs: slugs.forums,
      threadIds: ids.threads,
      postIds: ids.posts,
      albumSlugs: slugs.albums,
      photoIds: ids.photos,
      userIds: mapValues(ids.users, (id) => id),
    },
  };
};

export const authorIdOf = (plan: ImportPlan, legacyAuthor: number | string): number => {
  const legacyId = typeof legacyAuthor === 'number' ? legacyAuthor : numericAuthor(legacyAuthor);
  return (legacyId !== null && plan.ids.users.get(legacyId)) || plan.fallbackGhostId;
};

export const optionalAuthorIdOf = (plan: ImportPlan, legacyAuthorId: number): number | null =>
  plan.ids.users.get(legacyAuthorId) ?? null;
