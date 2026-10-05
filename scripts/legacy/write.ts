import { join } from 'node:path';
import { stat } from 'node:fs/promises';
import type { SQLiteTable } from 'drizzle-orm/sqlite-core';
import type { Db, Tx } from '../../server/db';
import { schema } from '../../server/db';
import { readImageSize, thumbnailPathFor, writeThumbnail } from '../../server/utils/imageProcessing';
import { htmlToPlainText } from '../../server/utils/html';
import type { CommentTarget } from '../../shared/utils/content';
import { THUMBNAILS_MEDIA_FOLDER } from '../../shared/utils/routes';
import type { AssetRegistry } from './assets';
import { isFaqPage, splitFaqPage } from './faq';
import { convertLegacyBbcode, convertLegacyHtml, lineBreaksToHtml } from './html';
import { pageBodiesReplacedByMaps, prepareMaps } from './maps';
import type { PreparedMaps } from './maps';
import { authorIdOf, optionalAuthorIdOf } from './plan';
import type { ImportPlan } from './plan';
import type { LegacyData, LegacyDownload, LegacyPhoto } from './read';
import type { LegacyRewriter } from './rewriter';
import { legacyPlainText, stripLegacySlashes, unixSecondsToDate } from './text';

const INSERT_CHUNK_SIZE = 400;
const PUBLIC_VISIBILITY_LEVELS = new Set([0, 101]);
const STAFF_ACCESS_LEVEL = 102;
const YOUTUBE_ID_PATTERN = /^[\w-]{11}$/;
const NEWS_CENTER_TABS_SETTING = 'newsCenterTabs';

const COMMENT_TARGET_BY_LEGACY_TYPE: Record<string, CommentTarget> = { N: 'news', C: 'page', P: 'photo', V: 'video' };

export interface ImportReport {
  inserted: Record<string, number>;
  skipped: Record<string, number>;
  missingFiles: string[];
  copiedFiles: number;
  externalImages: number;
}

interface PreparedPhoto {
  photo: LegacyPhoto;
  image: string;
  thumbnail: string;
  width: number;
  height: number;
}

interface PreparedDownload {
  download: LegacyDownload;
  file: string;
  fileSize: number;
}

interface WriteContext {
  data: LegacyData;
  plan: ImportPlan;
  rewriter: LegacyRewriter;
  assets: AssetRegistry;
  report: ImportReport;
}

const optionalDate = (seconds: number): Date | null => (seconds > 0 ? unixSecondsToDate(seconds) : null);

const PHOTO_ALBUM_FOLDER = 'images/photoalbum';

const photoLegacyPaths = (photo: LegacyPhoto): string[] => [
  `${PHOTO_ALBUM_FOLDER}/album_${photo.albumId}/${photo.filename}`,
  `${PHOTO_ALBUM_FOLDER}/${photo.filename}`,
];

const firstExistingPath = async (assets: AssetRegistry, legacyPaths: string[]): Promise<string | null> => {
  for (const legacyPath of legacyPaths) {
    if (await assets.exists(legacyPath)) {
      return legacyPath;
    }
  }
  return null;
};

const preparePhotos = async (context: WriteContext, uploadsDir: string): Promise<PreparedPhoto[]> => {
  const prepared: PreparedPhoto[] = [];
  for (const photo of context.plan.photos) {
    const candidates = photoLegacyPaths(photo);
    const legacyPath = await firstExistingPath(context.assets, candidates);
    const size = legacyPath ? await readImageSize(context.assets.sourceFile(legacyPath)) : null;
    if (!legacyPath || !size) {
      context.report.missingFiles.push(candidates[0]!);
      continue;
    }
    const image = context.assets.storedPath(legacyPath);
    const thumbnail = thumbnailPathFor(image, THUMBNAILS_MEDIA_FOLDER);
    await writeThumbnail(context.assets.sourceFile(legacyPath), join(uploadsDir, thumbnail));
    prepared.push({ photo, image, thumbnail, ...size });
  }
  return prepared;
};

const prepareDownloads = async (context: WriteContext): Promise<PreparedDownload[]> => {
  const prepared: PreparedDownload[] = [];
  for (const download of context.data.downloads) {
    const legacyPath = `downloads/${download.file}`;
    if (!(await context.assets.exists(legacyPath))) {
      context.report.missingFiles.push(legacyPath);
      continue;
    }
    const { size } = await stat(context.assets.sourceFile(legacyPath));
    prepared.push({ download, file: context.assets.storedPath(legacyPath), fileSize: size });
  }
  return prepared;
};

const existingAssetPath = async (assets: AssetRegistry, legacyPath: string): Promise<string | null> =>
  (await assets.exists(legacyPath)) ? assets.storedPath(legacyPath) : null;

const prepareImagePaths = async (
  assets: AssetRegistry,
  legacyPaths: Map<number, string>,
): Promise<Map<number, string | null>> => {
  const stored = new Map<number, string | null>();
  for (const [id, legacyPath] of legacyPaths) {
    stored.set(id, await existingAssetPath(assets, legacyPath));
  }
  return stored;
};

const insertAll = <Table extends SQLiteTable>(
  tx: Tx,
  report: ImportReport,
  name: string,
  table: Table,
  rows: Table['$inferInsert'][],
) => {
  for (let offset = 0; offset < rows.length; offset += INSERT_CHUNK_SIZE) {
    tx.insert(table)
      .values(rows.slice(offset, offset + INSERT_CHUNK_SIZE))
      .run();
  }
  report.inserted[name] = rows.length;
};

const countSkipped = (report: ImportReport, name: string, total: number, kept: number) => {
  if (total > kept) {
    report.skipped[name] = total - kept;
  }
};

const writeUsers = (tx: Tx, { plan, report }: WriteContext) => {
  insertAll(
    tx,
    report,
    'users',
    schema.users,
    plan.ghostUsers.map((ghost) => ({
      id: ghost.id,
      name: ghost.name,
      nameKey: ghost.nameKey,
      isGhost: true,
      legacyId: ghost.legacyId,
    })),
  );
};

const writeNews = (tx: Tx, context: WriteContext, categoryImages: Map<number, string | null>) => {
  const { data, plan, rewriter, report } = context;
  insertAll(
    tx,
    report,
    'newsCategories',
    schema.newsCategories,
    data.newsCategories.map((category) => ({
      id: plan.ids.newsCategories.get(category.id)!,
      slug: plan.slugs.newsCategories.get(category.id)!,
      name: legacyPlainText(category.name),
      image: categoryImages.get(category.id) ?? null,
      legacyId: category.id,
    })),
  );
  const toHtml = (stored: string, usesLineBreaks: boolean) =>
    convertLegacyHtml(usesLineBreaks ? lineBreaksToHtml(stored) : stored, rewriter);
  insertAll(
    tx,
    report,
    'news',
    schema.news,
    data.news.map((news) => {
      const publishedAt = unixSecondsToDate(news.publishedAt);
      const isPublic = !news.isDraft && PUBLIC_VISIBILITY_LEVELS.has(news.visibility);
      return {
        id: plan.ids.news.get(news.id)!,
        slug: plan.slugs.news.get(news.id)!,
        title: legacyPlainText(news.title),
        excerptHtml: toHtml(news.excerpt, news.usesLineBreaks),
        bodyHtml: toHtml(news.body, news.usesLineBreaks),
        categoryId: plan.ids.newsCategories.get(news.categoryId) ?? null,
        authorId: authorIdOf(plan, news.authorId),
        status: isPublic ? ('published' as const) : ('draft' as const),
        commentsEnabled: news.allowsComments,
        viewCount: news.viewCount,
        publishedAt,
        legacyId: news.id,
        createdAt: publishedAt,
        updatedAt: publishedAt,
      };
    }),
  );
};

const writePages = (tx: Tx, { data, plan, rewriter, report }: WriteContext, replacedBodies: Map<number, string>) => {
  const legacyContent = new Map(data.pages.map((page) => [page.id, page.content]));
  const bodyOf = (legacyId: number) =>
    replacedBodies.get(legacyId) ?? convertLegacyHtml(legacyContent.get(legacyId) ?? '', rewriter);
  insertAll(
    tx,
    report,
    'pages',
    schema.pages,
    plan.pages.map((page) => ({
      id: plan.ids.pages.get(page.key)!,
      parentId: page.parentKey ? plan.ids.pages.get(page.parentKey)! : null,
      slug: page.slug,
      path: page.path,
      title: page.title,
      kind: page.kind,
      bodyHtml: page.legacyId === null ? '' : bodyOf(page.legacyId),
      status: page.status,
      commentsEnabled: page.commentsEnabled,
      sortOrder: page.sortOrder,
      legacyId: page.legacyId,
      legacyTitle: page.legacyTitle,
    })),
  );
  countSkipped(report, 'pages', data.pages.length, plan.pages.filter((page) => page.legacyId !== null).length);
};

const SORT_ORDER_STEP = 10;

const writeFaq = (tx: Tx, { data, rewriter, report }: WriteContext) => {
  const faqPage = data.pages.find(isFaqPage);
  const categories = faqPage ? splitFaqPage(convertLegacyHtml(faqPage.content, rewriter)) : [];
  insertAll(
    tx,
    report,
    'faqCategories',
    schema.faqCategories,
    categories.map((category, index) => ({ id: index + 1, name: category.name, sortOrder: index * SORT_ORDER_STEP })),
  );
  insertAll(
    tx,
    report,
    'faqItems',
    schema.faqItems,
    categories.flatMap((category, categoryIndex) =>
      category.items.map((item, index) => ({
        categoryId: categoryIndex + 1,
        title: item.title,
        descriptionHtml: item.descriptionHtml,
        sortOrder: index * SORT_ORDER_STEP,
      })),
    ),
  );
};

const writeMaps = (tx: Tx, { report }: WriteContext, { maps, skippedMaps }: PreparedMaps) => {
  insertAll(
    tx,
    report,
    'maps',
    schema.maps,
    maps.map((map, index) => ({
      id: index + 1,
      slug: map.slug,
      title: map.title,
      image: map.image,
      imageWidth: map.imageWidth,
      imageHeight: map.imageHeight,
      teaserImage: map.teaserImage,
      status: 'published' as const,
      sortOrder: index,
    })),
  );
  const areas = maps.flatMap((map, mapIndex) =>
    map.areas.map((area, areaIndex) => ({ ...area, mapId: mapIndex + 1, sortOrder: areaIndex })),
  );
  const skippedAreas = maps.reduce((total, map) => total + map.skippedAreas, 0);
  insertAll(tx, report, 'mapAreas', schema.mapAreas, areas);
  countSkipped(report, 'maps', maps.length + skippedMaps, maps.length);
  countSkipped(report, 'mapAreas', areas.length + skippedAreas, areas.length);
};

const writeForum = (tx: Tx, { data, plan, rewriter, report }: WriteContext) => {
  insertAll(
    tx,
    report,
    'forumCategories',
    schema.forumCategories,
    plan.forumCategories.map((category) => ({
      id: plan.ids.forumCategories.get(category.id)!,
      name: legacyPlainText(category.name),
      sortOrder: category.sortOrder,
      legacyId: category.id,
    })),
  );

  const postsByThread = Map.groupBy(plan.posts, (post) => post.threadId);
  const threadsByForum = Map.groupBy(plan.threads, (thread) => thread.forumId);
  const threadPostCount = (legacyThreadId: number) => postsByThread.get(legacyThreadId)?.length ?? 0;

  insertAll(
    tx,
    report,
    'forums',
    schema.forums,
    plan.forums.map((forum) => {
      const threads = threadsByForum.get(forum.id) ?? [];
      return {
        id: plan.ids.forums.get(forum.id)!,
        categoryId: plan.ids.forumCategories.get(forum.categoryId)!,
        slug: plan.slugs.forums.get(forum.id)!,
        name: legacyPlainText(forum.name),
        description: legacyPlainText(forum.description),
        isStaffOnly: forum.access >= STAFF_ACCESS_LEVEL,
        sortOrder: forum.sortOrder,
        threadCount: threads.length,
        postCount: threads.reduce((total, thread) => total + threadPostCount(thread.id), 0),
        legacyId: forum.id,
      };
    }),
  );

  insertAll(
    tx,
    report,
    'threads',
    schema.threads,
    plan.threads.map((thread) => {
      const posts = postsByThread.get(thread.id) ?? [];
      const firstPostAt = posts[0]?.createdAt ?? thread.lastPostAt;
      return {
        id: plan.ids.threads.get(thread.id)!,
        forumId: plan.ids.forums.get(thread.forumId)!,
        title: legacyPlainText(thread.title),
        authorId: authorIdOf(plan, thread.authorId),
        isSticky: thread.isSticky,
        isLocked: thread.isLocked,
        viewCount: thread.viewCount,
        postCount: posts.length,
        lastPostAt: unixSecondsToDate(thread.lastPostAt),
        lastPostAuthorId: optionalAuthorIdOf(plan, thread.lastPostAuthorId),
        legacyId: thread.id,
        createdAt: unixSecondsToDate(firstPostAt),
      };
    }),
  );

  insertAll(
    tx,
    report,
    'posts',
    schema.posts,
    plan.posts.map((post) => ({
      id: plan.ids.posts.get(post.id)!,
      threadId: plan.ids.threads.get(post.threadId)!,
      authorId: authorIdOf(plan, post.authorId),
      bodyHtml: convertLegacyBbcode(post.message, rewriter, { smileys: post.usesSmileys }),
      legacyBbcode: post.message,
      editedAt: optionalDate(post.editedAt),
      editedById: post.editedAt > 0 ? optionalAuthorIdOf(plan, post.editedById) : null,
      legacyId: post.id,
      createdAt: unixSecondsToDate(post.createdAt),
    })),
  );
  countSkipped(report, 'threads', data.threads.length, plan.threads.length);
  countSkipped(report, 'posts', data.posts.length, plan.posts.length);
};

const writeGallery = (tx: Tx, context: WriteContext, photos: PreparedPhoto[]) => {
  const { data, plan, report } = context;
  const firstThumbnailByAlbum = new Map<number, string>();
  for (const prepared of photos) {
    if (!firstThumbnailByAlbum.has(prepared.photo.albumId)) {
      firstThumbnailByAlbum.set(prepared.photo.albumId, prepared.thumbnail);
    }
  }
  insertAll(
    tx,
    report,
    'albums',
    schema.albums,
    data.albums.map((album) => ({
      id: plan.ids.albums.get(album.id)!,
      slug: plan.slugs.albums.get(album.id)!,
      title: legacyPlainText(album.title),
      description: legacyPlainText(album.description),
      coverImage: firstThumbnailByAlbum.get(album.id) ?? null,
      sortOrder: album.sortOrder,
      legacyId: album.id,
      createdAt: unixSecondsToDate(album.createdAt),
    })),
  );
  insertAll(
    tx,
    report,
    'photos',
    schema.photos,
    photos.map(({ photo, image, thumbnail, width, height }) => ({
      id: plan.ids.photos.get(photo.id)!,
      albumId: plan.ids.albums.get(photo.albumId)!,
      title: legacyPlainText(photo.title),
      description: legacyPlainText(photo.description),
      image,
      thumbnail,
      width,
      height,
      authorId: optionalAuthorIdOf(plan, photo.authorId),
      viewCount: photo.viewCount,
      sortOrder: photo.sortOrder,
      legacyId: photo.id,
      createdAt: unixSecondsToDate(photo.createdAt),
    })),
  );
  countSkipped(report, 'photos', data.photos.length, photos.length);
};

const writeVideos = (tx: Tx, { data, plan, report }: WriteContext) => {
  insertAll(
    tx,
    report,
    'videoCategories',
    schema.videoCategories,
    data.videoCategories.map((category, index) => ({
      id: plan.ids.videoCategories.get(category.id)!,
      slug: plan.slugs.videoCategories.get(category.id)!,
      name: legacyPlainText(category.name),
      description: legacyPlainText(category.description),
      sortOrder: index,
      legacyId: category.id,
    })),
  );
  const videos = data.videos.filter(
    (video) => plan.ids.videoCategories.has(video.categoryId) && YOUTUBE_ID_PATTERN.test(video.youtubeId.trim()),
  );
  insertAll(
    tx,
    report,
    'videos',
    schema.videos,
    videos.map((video) => ({
      id: plan.ids.videos.get(video.id)!,
      categoryId: plan.ids.videoCategories.get(video.categoryId)!,
      title: legacyPlainText(video.title),
      description: legacyPlainText(video.description),
      youtubeId: video.youtubeId.trim(),
      authorId: optionalAuthorIdOf(plan, video.authorId),
      viewCount: video.viewCount,
      legacyId: video.id,
      createdAt: unixSecondsToDate(video.createdAt),
    })),
  );
  countSkipped(report, 'videos', data.videos.length, videos.length);
  return new Set(videos.map((video) => video.id));
};

const writeComments = (tx: Tx, context: WriteContext, photoIds: Set<number>, videoIds: Set<number>) => {
  const { data, plan, rewriter, report } = context;
  const targetIdOf: Record<CommentTarget, (legacyItemId: number) => number | undefined> = {
    news: (itemId) => plan.ids.news.get(itemId),
    page: (itemId) => plan.ids.pagesByLegacyId.get(itemId),
    photo: (itemId) => (photoIds.has(itemId) ? plan.ids.photos.get(itemId) : undefined),
    video: (itemId) => (videoIds.has(itemId) ? plan.ids.videos.get(itemId) : undefined),
  };
  const rows = data.comments.flatMap((comment) => {
    const targetKind = COMMENT_TARGET_BY_LEGACY_TYPE[comment.type.trim().toUpperCase()];
    const targetId = targetKind ? targetIdOf[targetKind](comment.itemId) : undefined;
    if (!targetKind || targetId === undefined) {
      return [];
    }
    return [
      {
        targetKind,
        targetId,
        authorId: authorIdOf(plan, comment.author),
        bodyHtml: convertLegacyBbcode(comment.message, rewriter),
        legacyBbcode: comment.message,
        isHidden: comment.isHidden,
        legacyId: comment.id,
        createdAt: unixSecondsToDate(comment.createdAt),
      },
    ];
  });
  insertAll(tx, report, 'comments', schema.comments, rows);
  countSkipped(report, 'comments', data.comments.length, rows.length);
};

const writeCommunity = (tx: Tx, { data, plan, rewriter, report }: WriteContext) => {
  insertAll(
    tx,
    report,
    'shouts',
    schema.shouts,
    data.shouts.map((shout) => ({
      authorId: authorIdOf(plan, shout.author),
      bodyHtml: convertLegacyBbcode(shout.message, rewriter),
      isHidden: shout.isHidden,
      legacyId: shout.id,
      createdAt: unixSecondsToDate(shout.createdAt),
    })),
  );

  const votesOf = new Map(data.pollVoteCounts.map((count) => [`${count.pollId}:${count.optionIndex}`, count.votes]));
  insertAll(
    tx,
    report,
    'polls',
    schema.polls,
    data.polls.map((poll) => ({
      id: plan.ids.polls.get(poll.id)!,
      question: legacyPlainText(poll.question),
      startedAt: unixSecondsToDate(poll.startedAt),
      endedAt: optionalDate(poll.endedAt),
      legacyId: poll.id,
    })),
  );
  insertAll(
    tx,
    report,
    'pollOptions',
    schema.pollOptions,
    data.polls.flatMap((poll) =>
      poll.options.flatMap((option, optionIndex) => {
        const label = legacyPlainText(option);
        return label
          ? [
              {
                pollId: plan.ids.polls.get(poll.id)!,
                label,
                sortOrder: optionIndex,
                archivedVoteCount: Number(votesOf.get(`${poll.id}:${optionIndex}`) ?? 0),
              },
            ]
          : [];
      }),
    ),
  );
};

const writeDirectory = (tx: Tx, { data, plan, rewriter, report }: WriteContext, downloads: PreparedDownload[]) => {
  insertAll(
    tx,
    report,
    'linkCategories',
    schema.linkCategories,
    data.linkCategories.map((category, index) => ({
      id: plan.ids.linkCategories.get(category.id)!,
      name: legacyPlainText(category.name),
      sortOrder: index,
      legacyId: category.id,
    })),
  );
  const links = data.links.filter((link) => plan.ids.linkCategories.has(link.categoryId));
  insertAll(
    tx,
    report,
    'links',
    schema.links,
    links.map((link) => ({
      categoryId: plan.ids.linkCategories.get(link.categoryId)!,
      title: legacyPlainText(link.title),
      description: legacyPlainText(htmlToPlainText(stripLegacySlashes(link.description))),
      url: rewriter.link(legacyPlainText(link.url)) ?? '',
      legacyId: link.id,
      createdAt: unixSecondsToDate(link.createdAt),
    })),
  );
  countSkipped(report, 'links', data.links.length, links.length);
  insertAll(
    tx,
    report,
    'downloads',
    schema.downloads,
    downloads.map(({ download, file, fileSize }) => ({
      title: legacyPlainText(download.title),
      description: legacyPlainText(htmlToPlainText(stripLegacySlashes(download.description))),
      file,
      fileSize,
      downloadCount: download.downloadCount,
      legacyId: download.id,
      createdAt: unixSecondsToDate(download.createdAt),
    })),
  );
  countSkipped(report, 'downloads', data.downloads.length, downloads.length);
};

const writeNavigation = (tx: Tx, { plan, rewriter, report }: WriteContext) => {
  insertAll(
    tx,
    report,
    'navigationSections',
    schema.navigationSections,
    plan.navigation.map((section, index) => ({ id: index + 1, title: section.title, sortOrder: index })),
  );
  insertAll(
    tx,
    report,
    'navigationLinks',
    schema.navigationLinks,
    plan.navigation.flatMap((section, sectionIndex) =>
      section.links.map((link, linkIndex) => ({
        sectionId: sectionIndex + 1,
        groupTitle: link.groupTitle,
        label: link.label,
        url: rewriter.link(link.legacyUrl) ?? '/',
        sortOrder: linkIndex,
      })),
    ),
  );
};

const writeSettings = (tx: Tx, { data, rewriter, report }: WriteContext) => {
  const tabs = data.newsCenterTabs.map((tab) => ({
    title: legacyPlainText(tab.title),
    bodyHtml: convertLegacyHtml(tab.content, rewriter),
  }));
  insertAll(tx, report, 'settings', schema.settings, [{ key: NEWS_CENTER_TABS_SETTING, value: tabs }]);
};

const writeExternalImages = (tx: Tx, { rewriter, report }: WriteContext) => {
  insertAll(
    tx,
    report,
    'externalImages',
    schema.externalImages,
    [...rewriter.externalImages].sort().map((url) => ({ url })),
  );
  report.externalImages = rewriter.externalImages.size;
};

export const writeImport = async (
  db: Db,
  uploadsDir: string,
  data: LegacyData,
  plan: ImportPlan,
  rewriter: LegacyRewriter,
  assets: AssetRegistry,
): Promise<ImportReport> => {
  const report: ImportReport = { inserted: {}, skipped: {}, missingFiles: [], copiedFiles: 0, externalImages: 0 };
  const context: WriteContext = { data, plan, rewriter, assets, report };

  const photos = await preparePhotos(context, uploadsDir);
  const downloads = await prepareDownloads(context);
  const categoryImages = await prepareImagePaths(
    assets,
    new Map(
      data.newsCategories
        .filter((category) => category.image)
        .map((category) => [category.id, `images/news_cats/${category.image}`]),
    ),
  );
  const maps = await prepareMaps(context, uploadsDir);

  db.transaction((tx) => {
    writeUsers(tx, context);
    writeNews(tx, context, categoryImages);
    writePages(tx, context, pageBodiesReplacedByMaps(maps.maps));
    writeFaq(tx, context);
    writeMaps(tx, context, maps);
    writeForum(tx, context);
    writeGallery(tx, context, photos);
    const videoIds = writeVideos(tx, context);
    writeComments(tx, context, new Set(photos.map(({ photo }) => photo.id)), videoIds);
    writeCommunity(tx, context);
    writeDirectory(tx, context, downloads);
    writeNavigation(tx, context);
    writeSettings(tx, context);
    writeExternalImages(tx, context);
  });

  const { copied, missing } = await assets.copyReferenced();
  report.copiedFiles = copied;
  report.missingFiles.push(...missing);
  return report;
};
