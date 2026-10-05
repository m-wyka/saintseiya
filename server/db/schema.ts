import { sql } from 'drizzle-orm';
import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core';
import { index, integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import {
  COMMENT_TARGETS,
  CONTENT_STATUSES,
  EXTERNAL_IMAGE_STATUSES,
  MAP_AREA_TARGETS,
  PAGE_KINDS,
} from '../../shared/utils/content';
import type { ModeratorPermission } from '../../shared/utils/roles';
import { USER_ROLES } from '../../shared/utils/roles';

const id = () => integer('id').primaryKey({ autoIncrement: true });
const timestamp = (name: string) => integer(name, { mode: 'timestamp' });
const createdAt = () =>
  timestamp('created_at')
    .notNull()
    .default(sql`(unixepoch())`);
const updatedAt = () =>
  timestamp('updated_at')
    .notNull()
    .default(sql`(unixepoch())`);
const flag = (name: string, initial = false) => integer(name, { mode: 'boolean' }).notNull().default(initial);
const legacyId = () => integer('legacy_id').unique();
const counter = (name: string) => integer(name).notNull().default(0);

export const users = sqliteTable('users', {
  id: id(),
  googleId: text('google_id').unique(),
  email: text('email').unique(),
  name: text('name').notNull(),
  nameKey: text('name_key').notNull().unique(),
  avatarUrl: text('avatar_url'),
  role: text('role', { enum: USER_ROLES }).notNull().default('user'),
  permissions: text('permissions', { mode: 'json' }).$type<ModeratorPermission[]>().notNull().default([]),
  isGhost: flag('is_ghost'),
  bannedAt: timestamp('banned_at'),
  lastSeenAt: timestamp('last_seen_at'),
  legacyId: legacyId(),
  createdAt: createdAt(),
});

export const newsCategories = sqliteTable('news_categories', {
  id: id(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  image: text('image'),
  legacyId: legacyId(),
});

export const tags = sqliteTable('tags', {
  id: id(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
});

export const news = sqliteTable(
  'news',
  {
    id: id(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    excerptHtml: text('excerpt_html').notNull().default(''),
    bodyHtml: text('body_html').notNull().default(''),
    categoryId: integer('category_id').references(() => newsCategories.id, { onDelete: 'set null' }),
    authorId: integer('author_id')
      .notNull()
      .references(() => users.id),
    status: text('status', { enum: CONTENT_STATUSES }).notNull().default('draft'),
    commentsEnabled: flag('comments_enabled', true),
    viewCount: counter('view_count'),
    publishedAt: timestamp('published_at'),
    legacyId: legacyId(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('news_published_idx').on(table.status, table.publishedAt),
    index('news_category_idx').on(table.categoryId),
  ],
);

export const newsTags = sqliteTable(
  'news_tags',
  {
    newsId: integer('news_id')
      .notNull()
      .references(() => news.id, { onDelete: 'cascade' }),
    tagId: integer('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.newsId, table.tagId] }), index('news_tags_tag_idx').on(table.tagId)],
);

export const pages = sqliteTable(
  'pages',
  {
    id: id(),
    parentId: integer('parent_id').references((): AnySQLiteColumn => pages.id, { onDelete: 'set null' }),
    slug: text('slug').notNull(),
    path: text('path').notNull().unique(),
    title: text('title').notNull(),
    kind: text('kind', { enum: PAGE_KINDS }).notNull().default('article'),
    bodyHtml: text('body_html').notNull().default(''),
    status: text('status', { enum: CONTENT_STATUSES }).notNull().default('draft'),
    commentsEnabled: flag('comments_enabled', true),
    sortOrder: counter('sort_order'),
    viewCount: counter('view_count'),
    legacyId: legacyId(),
    legacyTitle: text('legacy_title'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index('pages_parent_idx').on(table.parentId, table.sortOrder)],
);

export const pageTags = sqliteTable(
  'page_tags',
  {
    pageId: integer('page_id')
      .notNull()
      .references(() => pages.id, { onDelete: 'cascade' }),
    tagId: integer('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.pageId, table.tagId] }), index('page_tags_tag_idx').on(table.tagId)],
);

export const maps = sqliteTable('maps', {
  id: id(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  image: text('image').notNull(),
  imageWidth: integer('image_width').notNull(),
  imageHeight: integer('image_height').notNull(),
  teaserImage: text('teaser_image'),
  status: text('status', { enum: CONTENT_STATUSES }).notNull().default('draft'),
  sortOrder: counter('sort_order'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const mapAreas = sqliteTable(
  'map_areas',
  {
    id: id(),
    mapId: integer('map_id')
      .notNull()
      .references(() => maps.id, { onDelete: 'cascade' }),
    label: text('label').notNull(),
    leftPercent: real('left_percent').notNull(),
    topPercent: real('top_percent').notNull(),
    widthPercent: real('width_percent').notNull(),
    heightPercent: real('height_percent').notNull(),
    targetKind: text('target_kind', { enum: MAP_AREA_TARGETS }).notNull(),
    pageId: integer('page_id').references(() => pages.id, { onDelete: 'set null' }),
    url: text('url'),
    contentHtml: text('content_html'),
    sortOrder: counter('sort_order'),
  },
  (table) => [index('map_areas_map_idx').on(table.mapId, table.sortOrder)],
);

export const forumCategories = sqliteTable('forum_categories', {
  id: id(),
  name: text('name').notNull(),
  sortOrder: counter('sort_order'),
  legacyId: legacyId(),
});

export const forums = sqliteTable(
  'forums',
  {
    id: id(),
    categoryId: integer('category_id')
      .notNull()
      .references(() => forumCategories.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    description: text('description').notNull().default(''),
    isStaffOnly: flag('is_staff_only'),
    sortOrder: counter('sort_order'),
    threadCount: counter('thread_count'),
    postCount: counter('post_count'),
    lastPostAt: timestamp('last_post_at'),
    legacyId: legacyId(),
  },
  (table) => [index('forums_category_idx').on(table.categoryId, table.sortOrder)],
);

export const threads = sqliteTable(
  'threads',
  {
    id: id(),
    forumId: integer('forum_id')
      .notNull()
      .references(() => forums.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    authorId: integer('author_id')
      .notNull()
      .references(() => users.id),
    isSticky: flag('is_sticky'),
    isLocked: flag('is_locked'),
    viewCount: counter('view_count'),
    postCount: counter('post_count'),
    lastPostAt: timestamp('last_post_at').notNull(),
    lastPostAuthorId: integer('last_post_author_id').references(() => users.id),
    legacyId: legacyId(),
    createdAt: createdAt(),
  },
  (table) => [index('threads_forum_idx').on(table.forumId, table.isSticky, table.lastPostAt)],
);

export const posts = sqliteTable(
  'posts',
  {
    id: id(),
    threadId: integer('thread_id')
      .notNull()
      .references(() => threads.id, { onDelete: 'cascade' }),
    authorId: integer('author_id')
      .notNull()
      .references(() => users.id),
    bodyHtml: text('body_html').notNull(),
    legacyBbcode: text('legacy_bbcode'),
    editedAt: timestamp('edited_at'),
    editedById: integer('edited_by_id').references(() => users.id),
    legacyId: legacyId(),
    createdAt: createdAt(),
  },
  (table) => [
    index('posts_thread_idx').on(table.threadId, table.createdAt),
    index('posts_author_idx').on(table.authorId),
  ],
);

export const comments = sqliteTable(
  'comments',
  {
    id: id(),
    targetKind: text('target_kind', { enum: COMMENT_TARGETS }).notNull(),
    targetId: integer('target_id').notNull(),
    authorId: integer('author_id')
      .notNull()
      .references(() => users.id),
    bodyHtml: text('body_html').notNull(),
    legacyBbcode: text('legacy_bbcode'),
    isHidden: flag('is_hidden'),
    legacyId: legacyId(),
    createdAt: createdAt(),
  },
  (table) => [
    index('comments_target_idx').on(table.targetKind, table.targetId, table.createdAt),
    index('comments_recent_idx').on(table.createdAt),
  ],
);

export const albums = sqliteTable('albums', {
  id: id(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  coverImage: text('cover_image'),
  sortOrder: counter('sort_order'),
  legacyId: legacyId(),
  createdAt: createdAt(),
});

export const photos = sqliteTable(
  'photos',
  {
    id: id(),
    albumId: integer('album_id')
      .notNull()
      .references(() => albums.id, { onDelete: 'cascade' }),
    title: text('title').notNull().default(''),
    description: text('description').notNull().default(''),
    image: text('image').notNull(),
    thumbnail: text('thumbnail').notNull(),
    width: integer('width').notNull(),
    height: integer('height').notNull(),
    authorId: integer('author_id').references(() => users.id),
    viewCount: counter('view_count'),
    sortOrder: counter('sort_order'),
    legacyId: legacyId(),
    createdAt: createdAt(),
  },
  (table) => [index('photos_album_idx').on(table.albumId, table.sortOrder)],
);

export const videoCategories = sqliteTable('video_categories', {
  id: id(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  sortOrder: counter('sort_order'),
  legacyId: legacyId(),
});

export const videos = sqliteTable(
  'videos',
  {
    id: id(),
    categoryId: integer('category_id')
      .notNull()
      .references(() => videoCategories.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    youtubeId: text('youtube_id').notNull(),
    authorId: integer('author_id').references(() => users.id),
    viewCount: counter('view_count'),
    legacyId: legacyId(),
    createdAt: createdAt(),
  },
  (table) => [index('videos_category_idx').on(table.categoryId, table.createdAt)],
);

export const shouts = sqliteTable(
  'shouts',
  {
    id: id(),
    authorId: integer('author_id')
      .notNull()
      .references(() => users.id),
    bodyHtml: text('body_html').notNull(),
    isHidden: flag('is_hidden'),
    legacyId: legacyId(),
    createdAt: createdAt(),
  },
  (table) => [index('shouts_recent_idx').on(table.createdAt)],
);

export const polls = sqliteTable('polls', {
  id: id(),
  question: text('question').notNull(),
  startedAt: timestamp('started_at').notNull(),
  endedAt: timestamp('ended_at'),
  legacyId: legacyId(),
});

export const pollOptions = sqliteTable(
  'poll_options',
  {
    id: id(),
    pollId: integer('poll_id')
      .notNull()
      .references(() => polls.id, { onDelete: 'cascade' }),
    label: text('label').notNull(),
    sortOrder: counter('sort_order'),
    archivedVoteCount: counter('archived_vote_count'),
  },
  (table) => [index('poll_options_poll_idx').on(table.pollId, table.sortOrder)],
);

export const pollVotes = sqliteTable(
  'poll_votes',
  {
    pollId: integer('poll_id')
      .notNull()
      .references(() => polls.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    optionId: integer('option_id')
      .notNull()
      .references(() => pollOptions.id, { onDelete: 'cascade' }),
    createdAt: createdAt(),
  },
  (table) => [primaryKey({ columns: [table.pollId, table.userId] })],
);

export const linkCategories = sqliteTable('link_categories', {
  id: id(),
  name: text('name').notNull(),
  sortOrder: counter('sort_order'),
  legacyId: legacyId(),
});

export const links = sqliteTable(
  'links',
  {
    id: id(),
    categoryId: integer('category_id')
      .notNull()
      .references(() => linkCategories.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    url: text('url').notNull(),
    legacyId: legacyId(),
    createdAt: createdAt(),
  },
  (table) => [index('links_category_idx').on(table.categoryId)],
);

export const downloads = sqliteTable('downloads', {
  id: id(),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  file: text('file').notNull(),
  fileSize: integer('file_size').notNull(),
  downloadCount: counter('download_count'),
  legacyId: legacyId(),
  createdAt: createdAt(),
});

export const mediaImages = sqliteTable('media_images', {
  id: id(),
  image: text('image').notNull().unique(),
  alt: text('alt').notNull().default(''),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  uploadedById: integer('uploaded_by_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: createdAt(),
});

export const externalImages = sqliteTable('external_images', {
  url: text('url').primaryKey(),
  status: text('status', { enum: EXTERNAL_IMAGE_STATUSES }).notNull().default('unchecked'),
  localImage: text('local_image'),
  checkedAt: timestamp('checked_at'),
});

export const navigationSections = sqliteTable('navigation_sections', {
  id: id(),
  title: text('title').notNull(),
  sortOrder: counter('sort_order'),
});

export const navigationLinks = sqliteTable(
  'navigation_links',
  {
    id: id(),
    sectionId: integer('section_id')
      .notNull()
      .references(() => navigationSections.id, { onDelete: 'cascade' }),
    groupTitle: text('group_title'),
    label: text('label').notNull(),
    url: text('url').notNull(),
    sortOrder: counter('sort_order'),
  },
  (table) => [index('navigation_links_section_idx').on(table.sectionId, table.sortOrder)],
);

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value', { mode: 'json' }).notNull(),
});
