export type YoutubePosterQuality = 'mqdefault' | 'hqdefault';

// YouTube answers for a removed video with this grey placeholder instead of an error.
const REMOVED_VIDEO_POSTER_SIZE = { width: 120, height: 90 };

export const youtubePosterUrl = (youtubeId: string, quality: YoutubePosterQuality = 'mqdefault'): string =>
  `https://i.ytimg.com/vi/${youtubeId}/${quality}.jpg`;

export const youtubePlayerUrl = (youtubeId: string): string =>
  `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1`;

export const isRemovedVideoPoster = (size: { naturalWidth: number; naturalHeight: number }): boolean =>
  size.naturalWidth === REMOVED_VIDEO_POSTER_SIZE.width && size.naturalHeight === REMOVED_VIDEO_POSTER_SIZE.height;
