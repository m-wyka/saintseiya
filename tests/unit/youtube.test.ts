import { describe, expect, it } from 'vitest';
import { isRemovedVideoPoster, youtubePlayerUrl, youtubePosterUrl } from '../../app/utils/youtube';

describe('YouTube addresses', () => {
  it('builds a poster in the requested size and a player that starts at once', () => {
    expect(youtubePosterUrl('dEY9fXqqaFE')).toBe('https://i.ytimg.com/vi/dEY9fXqqaFE/mqdefault.jpg');
    expect(youtubePosterUrl('dEY9fXqqaFE', 'hqdefault')).toBe('https://i.ytimg.com/vi/dEY9fXqqaFE/hqdefault.jpg');
    expect(youtubePlayerUrl('dEY9fXqqaFE')).toBe('https://www.youtube-nocookie.com/embed/dEY9fXqqaFE?autoplay=1');
  });
});

describe('poster of a removed video', () => {
  it('is recognised by the size of the placeholder YouTube sends instead', () => {
    expect(isRemovedVideoPoster({ naturalWidth: 120, naturalHeight: 90 })).toBe(true);
  });

  it('is not confused with a real poster or with one that failed to load', () => {
    expect(isRemovedVideoPoster({ naturalWidth: 320, naturalHeight: 180 })).toBe(false);
    expect(isRemovedVideoPoster({ naturalWidth: 480, naturalHeight: 360 })).toBe(false);
    expect(isRemovedVideoPoster({ naturalWidth: 0, naturalHeight: 0 })).toBe(false);
  });
});
