import { UNTITLED_PHOTO_KEY } from '#shared/utils/content';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { routes } from '#shared/utils/routes';
import type { CommentTarget } from '#shared/utils/content';
import type { ContentLocale } from '#shared/utils/locales';
import { DEFAULT_LOCALE } from '#shared/utils/locales';
import { authorColumns } from './authors';
import { schema, useDb } from './db';
import { readSetting } from './settings';
import { localized } from './translations';

const LATEST_THREAD_COUNT = 8;
const BUSIEST_THREAD_COUNT = 5;
const LATEST_COMMENT_COUNT = 6;
const LATEST_PHOTO_COUNT = 8;
const LATEST_VIDEO_COUNT = 4;

const publicThreads = (order: 'latest' | 'busiest', limit: number, locale: ContentLocale) =>
  useDb()
    .select({
      id: schema.threads.id,
      title: schema.threads.title,
      postCount: schema.threads.postCount,
      lastPostAt: schema.threads.lastPostAt,
      forumName: localized(schema.forums.name, locale),
      lastPostAuthor: authorColumns,
    })
    .from(schema.threads)
    .innerJoin(schema.forums, eq(schema.forums.id, schema.threads.forumId))
    .leftJoin(schema.users, eq(schema.users.id, schema.threads.lastPostAuthorId))
    .where(eq(schema.forums.isStaffOnly, false))
    .orderBy(order === 'latest' ? desc(schema.threads.lastPostAt) : desc(schema.threads.postCount))
    .limit(limit)
    .all();

interface CommentTargetSummary {
  title: string;
  url: string;
}

const describeTargets = (
  kind: CommentTarget,
  ids: number[],
  locale: ContentLocale,
): Map<number, CommentTargetSummary> => {
  const db = useDb();
  if (!ids.length) {
    return new Map();
  }
  if (kind === 'news') {
    const rows = db
      .select({ id: schema.news.id, title: localized(schema.news.title, locale), slug: schema.news.slug })
      .from(schema.news)
      .where(and(inArray(schema.news.id, ids), eq(schema.news.status, 'published')))
      .all();
    return new Map(rows.map((row) => [row.id, { title: row.title, url: routes.news(row.slug) }]));
  }
  if (kind === 'page') {
    const rows = db
      .select({ id: schema.pages.id, title: localized(schema.pages.title, locale), path: schema.pages.path })
      .from(schema.pages)
      .where(and(inArray(schema.pages.id, ids), eq(schema.pages.status, 'published')))
      .all();
    return new Map(rows.map((row) => [row.id, { title: row.title, url: routes.page(row.path) }]));
  }
  if (kind === 'photo') {
    const rows = db
      .select({ id: schema.photos.id, title: localized(schema.photos.title, locale) })
      .from(schema.photos)
      .where(inArray(schema.photos.id, ids))
      .all();
    return new Map(rows.map((row) => [row.id, { title: row.title || UNTITLED_PHOTO_KEY, url: routes.photo(row.id) }]));
  }
  const rows = db
    .select({ id: schema.videos.id, title: localized(schema.videos.title, locale) })
    .from(schema.videos)
    .where(inArray(schema.videos.id, ids))
    .all();
  return new Map(rows.map((row) => [row.id, { title: row.title, url: routes.videos() }]));
};

interface CommentTargetRef {
  targetKind: CommentTarget;
  targetId: number;
}

export const describeCommentTargets = (comments: CommentTargetRef[], locale: ContentLocale = DEFAULT_LOCALE) => {
  const targetsByKind = new Map(
    [...Map.groupBy(comments, (comment) => comment.targetKind)].map(([kind, group]) => [
      kind,
      describeTargets(
        kind,
        group.map((comment) => comment.targetId),
        locale,
      ),
    ]),
  );
  return ({ targetKind, targetId }: CommentTargetRef): CommentTargetSummary | undefined =>
    targetsByKind.get(targetKind)?.get(targetId);
};

export const latestComments = (limit = LATEST_COMMENT_COUNT, locale: ContentLocale = DEFAULT_LOCALE) => {
  const comments = useDb()
    .select({
      id: schema.comments.id,
      targetKind: schema.comments.targetKind,
      targetId: schema.comments.targetId,
      bodyHtml: schema.comments.bodyHtml,
      createdAt: schema.comments.createdAt,
      author: authorColumns,
    })
    .from(schema.comments)
    .innerJoin(schema.users, eq(schema.users.id, schema.comments.authorId))
    .where(eq(schema.comments.isHidden, false))
    .orderBy(desc(schema.comments.createdAt))
    .limit(limit * 2)
    .all();
  const targetOf = describeCommentTargets(comments, locale);
  return comments
    .flatMap(({ targetKind, targetId, bodyHtml, ...comment }) => {
      const target = targetOf({ targetKind, targetId });
      return target ? [{ ...comment, excerpt: htmlToPlainText(bodyHtml).slice(0, 160), target }] : [];
    })
    .slice(0, limit);
};

const latestPhotos = (locale: ContentLocale) =>
  useDb()
    .select({
      id: schema.photos.id,
      title: localized(schema.photos.title, locale),
      thumbnail: schema.photos.thumbnail,
      width: schema.photos.width,
      height: schema.photos.height,
      albumTitle: localized(schema.albums.title, locale),
    })
    .from(schema.photos)
    .innerJoin(schema.albums, eq(schema.albums.id, schema.photos.albumId))
    .orderBy(desc(schema.photos.createdAt), desc(schema.photos.id))
    .limit(LATEST_PHOTO_COUNT)
    .all();

const latestVideos = (locale: ContentLocale) =>
  useDb()
    .select({
      id: schema.videos.id,
      title: localized(schema.videos.title, locale),
      youtubeId: schema.videos.youtubeId,
    })
    .from(schema.videos)
    .orderBy(desc(schema.videos.createdAt), desc(schema.videos.id))
    .limit(LATEST_VIDEO_COUNT)
    .all();

export const homeContent = (locale: ContentLocale = DEFAULT_LOCALE) => ({
  newsCenterTabs: readSetting('newsCenterTabs', locale).map((tab) => ({
    ...tab,
    bodyHtml: markMissingImages(tab.bodyHtml),
  })),
  latestThreads: publicThreads('latest', LATEST_THREAD_COUNT, locale),
  busiestThreads: publicThreads('busiest', BUSIEST_THREAD_COUNT, locale),
  latestComments: latestComments(LATEST_COMMENT_COUNT, locale),
  latestPhotos: latestPhotos(locale),
  latestVideos: latestVideos(locale),
});
