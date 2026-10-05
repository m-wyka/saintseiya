import type { LegacySource } from './source';
import type { LegacyPage } from './pageTree';
import type { LegacySiteLink } from './navigation';

const MAX_POLL_OPTIONS = 10;
const MAX_NEWS_CENTER_TABS = 5;

export interface LegacyUser {
  id: number;
  name: string;
}

export interface LegacyNewsCategory {
  id: number;
  name: string;
  image: string;
}

export interface LegacyNews {
  id: number;
  title: string;
  categoryId: number;
  excerpt: string;
  body: string;
  usesLineBreaks: boolean;
  authorId: number;
  publishedAt: number;
  visibility: number;
  isDraft: boolean;
  viewCount: number;
  allowsComments: boolean;
}

export interface LegacyForum {
  id: number;
  categoryId: number;
  name: string;
  description: string;
  sortOrder: number;
  access: number;
}

export interface LegacyThread {
  id: number;
  forumId: number;
  title: string;
  authorId: number;
  viewCount: number;
  lastPostAt: number;
  lastPostAuthorId: number;
  isSticky: boolean;
  isLocked: boolean;
}

export interface LegacyPost {
  id: number;
  threadId: number;
  message: string;
  usesSmileys: boolean;
  authorId: number;
  createdAt: number;
  editedById: number;
  editedAt: number;
}

export interface LegacyComment {
  id: number;
  itemId: number;
  type: string;
  author: string;
  message: string;
  createdAt: number;
  isHidden: boolean;
}

export interface LegacyAlbum {
  id: number;
  title: string;
  description: string;
  sortOrder: number;
  createdAt: number;
}

export interface LegacyPhoto {
  id: number;
  albumId: number;
  title: string;
  description: string;
  filename: string;
  authorId: number;
  viewCount: number;
  sortOrder: number;
  createdAt: number;
}

export interface LegacyVideoCategory {
  id: number;
  name: string;
  description: string;
}

export interface LegacyVideo {
  id: number;
  categoryId: number;
  title: string;
  description: string;
  youtubeId: string;
  authorId: number;
  viewCount: number;
  createdAt: number;
}

export interface LegacyShout {
  id: number;
  author: string;
  message: string;
  createdAt: number;
  isHidden: boolean;
}

export interface LegacyPoll {
  id: number;
  question: string;
  options: string[];
  startedAt: number;
  endedAt: number;
}

export interface LegacyPollVoteCount {
  pollId: number;
  optionIndex: number;
  votes: number;
}

export interface LegacyLinkCategory {
  id: number;
  name: string;
}

export interface LegacyLink {
  id: number;
  categoryId: number;
  title: string;
  description: string;
  url: string;
  createdAt: number;
}

export interface LegacyDownload {
  id: number;
  title: string;
  description: string;
  file: string;
  createdAt: number;
  downloadCount: number;
}

export interface LegacyNewsCenterTab {
  title: string;
  content: string;
}

export interface LegacyData {
  users: LegacyUser[];
  newsCategories: LegacyNewsCategory[];
  news: LegacyNews[];
  pages: LegacyPage[];
  siteLinks: LegacySiteLink[];
  forums: LegacyForum[];
  threads: LegacyThread[];
  posts: LegacyPost[];
  comments: LegacyComment[];
  albums: LegacyAlbum[];
  photos: LegacyPhoto[];
  videoCategories: LegacyVideoCategory[];
  videos: LegacyVideo[];
  shouts: LegacyShout[];
  polls: LegacyPoll[];
  pollVoteCounts: LegacyPollVoteCount[];
  linkCategories: LegacyLinkCategory[];
  links: LegacyLink[];
  downloads: LegacyDownload[];
  newsCenterTabs: LegacyNewsCenterTab[];
}

type FlagColumns<Row, Keys extends keyof Row> = Omit<Row, Keys> & Record<Keys, number>;

const withFlags = <Row extends object, Keys extends keyof Row>(rows: FlagColumns<Row, Keys>[], keys: Keys[]): Row[] =>
  rows.map((row) => ({ ...row, ...Object.fromEntries(keys.map((key) => [key, Boolean(row[key])])) }) as unknown as Row);

const readPolls = async (source: LegacySource): Promise<LegacyPoll[]> => {
  const optionColumns = Array.from({ length: MAX_POLL_OPTIONS }, (_, index) => `poll_opt_${index}`);
  const rows = await source.rows<Record<string, string | number>>(
    `SELECT poll_id, poll_title, ${optionColumns.join(', ')}, poll_started, poll_ended FROM fusion_polls ORDER BY poll_id`,
  );
  return rows.map((row) => ({
    id: Number(row.poll_id),
    question: String(row.poll_title),
    options: optionColumns.map((column) => String(row[column] ?? '')),
    startedAt: Number(row.poll_started),
    endedAt: Number(row.poll_ended),
  }));
};

const readNewsCenterTabs = async (source: LegacySource): Promise<LegacyNewsCenterTab[]> => {
  const [settings] = await source.rows<Record<string, string | number>>('SELECT * FROM fusion_fp_tabs LIMIT 1');
  if (!settings) {
    return [];
  }
  return Array.from({ length: MAX_NEWS_CENTER_TABS }, (_, index) => index + 1)
    .filter((tab) => Number(settings[`tab${tab}_enable`]) === 1)
    .map((tab) => ({ title: String(settings[`tab${tab}_name`]), content: String(settings[`tab${tab}_content`]) }));
};

export const readLegacyData = async (source: LegacySource): Promise<LegacyData> => ({
  users: await source.rows<LegacyUser>('SELECT user_id id, user_name name FROM fusion_users ORDER BY user_id'),
  newsCategories: await source.rows<LegacyNewsCategory>(
    'SELECT news_cat_id id, news_cat_name name, news_cat_image image FROM fusion_news_cats ORDER BY news_cat_id',
  ),
  news: withFlags<LegacyNews, 'isDraft' | 'allowsComments' | 'usesLineBreaks'>(
    await source.rows(
      `SELECT news_id id, news_subject title, news_cat categoryId, news_news excerpt, news_extended body,
              news_breaks = 'y' usesLineBreaks, news_name authorId, news_datestamp publishedAt, news_visibility visibility,
              news_draft isDraft, news_reads viewCount, news_allow_comments allowsComments
       FROM fusion_news ORDER BY news_id`,
    ),
    ['isDraft', 'allowsComments', 'usesLineBreaks'],
  ),
  pages: withFlags<LegacyPage, 'allowsComments'>(
    await source.rows(
      `SELECT page_id id, page_title title, page_content content, page_access access, page_allow_comments allowsComments
       FROM fusion_custom_pages ORDER BY page_id`,
    ),
    ['allowsComments'],
  ),
  siteLinks: await source.rows<LegacySiteLink>(
    'SELECT link_name name, link_url url, link_visibility visibility FROM fusion_site_links ORDER BY link_order',
  ),
  forums: await source.rows<LegacyForum>(
    `SELECT forum_id id, forum_cat categoryId, forum_name name, forum_description description, forum_order sortOrder,
            forum_access access
     FROM fusion_forums ORDER BY forum_order, forum_id`,
  ),
  threads: withFlags<LegacyThread, 'isSticky' | 'isLocked'>(
    await source.rows(
      `SELECT thread_id id, forum_id forumId, thread_subject title, thread_author authorId, thread_views viewCount,
              thread_lastpost lastPostAt, thread_lastuser lastPostAuthorId, thread_sticky isSticky, thread_locked isLocked
       FROM fusion_threads WHERE thread_hidden = 0 ORDER BY thread_id`,
    ),
    ['isSticky', 'isLocked'],
  ),
  posts: withFlags<LegacyPost, 'usesSmileys'>(
    await source.rows(
      `SELECT post_id id, thread_id threadId, post_message message, post_smileys usesSmileys, post_author authorId,
              post_datestamp createdAt, post_edituser editedById, post_edittime editedAt
       FROM fusion_posts WHERE post_hidden = 0 ORDER BY post_id`,
    ),
    ['usesSmileys'],
  ),
  comments: withFlags<LegacyComment, 'isHidden'>(
    await source.rows(
      `SELECT comment_id id, comment_item_id itemId, comment_type type, comment_name author, comment_message message,
              comment_datestamp createdAt, comment_hidden isHidden
       FROM fusion_comments ORDER BY comment_id`,
    ),
    ['isHidden'],
  ),
  albums: await source.rows<LegacyAlbum>(
    `SELECT album_id id, album_title title, album_description description, album_order sortOrder,
            album_datestamp createdAt
     FROM fusion_photo_albums ORDER BY album_order, album_id`,
  ),
  photos: await source.rows<LegacyPhoto>(
    `SELECT photo_id id, album_id albumId, photo_title title, photo_description description, photo_filename filename,
            photo_user authorId, photo_views viewCount, photo_order sortOrder, photo_datestamp createdAt
     FROM fusion_photos ORDER BY album_id, photo_order, photo_id`,
  ),
  videoCategories: await source.rows<LegacyVideoCategory>(
    'SELECT video_cat_id id, video_cat_name name, video_cat_description description FROM fusion_video_cats ORDER BY video_cat_id',
  ),
  videos: await source.rows<LegacyVideo>(
    `SELECT video_id id, video_cat categoryId, video_name title, video_description description, video_url youtubeId,
            video_user authorId, video_views viewCount, video_datestamp createdAt
     FROM fusion_videos ORDER BY video_id`,
  ),
  shouts: withFlags<LegacyShout, 'isHidden'>(
    await source.rows(
      `SELECT shout_id id, shout_name author, shout_message message, shout_datestamp createdAt, shout_hidden isHidden
       FROM fusion_shoutbox ORDER BY shout_id`,
    ),
    ['isHidden'],
  ),
  polls: await readPolls(source),
  pollVoteCounts: await source.rows<LegacyPollVoteCount>(
    'SELECT poll_id pollId, vote_opt optionIndex, COUNT(*) votes FROM fusion_poll_votes GROUP BY poll_id, vote_opt',
  ),
  linkCategories: await source.rows<LegacyLinkCategory>(
    'SELECT weblink_cat_id id, weblink_cat_name name FROM fusion_weblink_cats ORDER BY weblink_cat_id',
  ),
  links: await source.rows<LegacyLink>(
    `SELECT weblink_id id, weblink_cat categoryId, weblink_name title, weblink_description description, weblink_url url,
            weblink_datestamp createdAt
     FROM fusion_weblinks ORDER BY weblink_id`,
  ),
  downloads: await source.rows<LegacyDownload>(
    `SELECT download_id id, download_title title,
            IF(download_description_short <> '', download_description_short, download_description) description,
            download_file file, download_datestamp createdAt, download_count downloadCount
     FROM fusion_downloads WHERE download_file <> '' ORDER BY download_id`,
  ),
  newsCenterTabs: await readNewsCenterTabs(source),
});
