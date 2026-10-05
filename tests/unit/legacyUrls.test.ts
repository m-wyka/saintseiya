import { describe, expect, it } from 'vitest';
import { isLegacySiteUrl, parseLegacyUrl } from '../../shared/utils/legacyUrls';

describe('parseLegacyUrl', () => {
  it.each([
    ['viewpage.php?page_id=479', { kind: 'page', legacyId: 479 }],
    ['/viewpage.php?page_id=30', { kind: 'page', legacyId: 30 }],
    ['../viewpage.php?page_id=30', { kind: 'page', legacyId: 30 }],
    ['http://saintseiya.netserwer.pl/viewpage.php?page_id=761', { kind: 'page', legacyId: 761 }],
    ['http://www.saintseiya.netserwer.pl/news.php?readmore=12', { kind: 'news', legacyId: 12 }],
    ['news.php', { kind: 'home' }],
    ['index.php', { kind: 'home' }],
    ['http://saintseiya.netserwer.pl/', { kind: 'home' }],
    ['news_cats.php?cat_id=27', { kind: 'newsCategory', legacyId: 27 }],
    ['news_cats.php', { kind: 'newsList' }],
    ['forum/index.php', { kind: 'forumIndex' }],
    ['forum/viewforum.php?forum_id=43', { kind: 'forum', legacyId: 43 }],
    ['forum/viewthread.php?thread_id=126', { kind: 'thread', legacyId: 126 }],
    ['forum/viewthread.php?thread_id=126&pid=1582#post_1582', { kind: 'post', legacyId: 1582 }],
    ['photogallery.php', { kind: 'gallery' }],
    ['photogallery.php?album_id=8', { kind: 'album', legacyId: 8 }],
    ['photogallery.php?photo_id=351', { kind: 'photo', legacyId: 351 }],
    ['infusions/fusion_tube/videos.php', { kind: 'videos' }],
    ['profile.php?lookup=5', { kind: 'user', legacyId: 5 }],
    ['weblinks.php', { kind: 'links' }],
    ['kr/index.html', { kind: 'map', slug: 'krolestwo-umarlych' }],
    ['http://saintseiya.netserwer.pl/posejdon.html', { kind: 'map', slug: 'krolestwo-posejdona' }],
    ['/img/niebo/1s.jpg', { kind: 'asset', path: 'img/niebo/1s.jpg' }],
    ['images/photoalbum/album_8/avek%20114.jpg', { kind: 'asset', path: 'images/photoalbum/album_8/avek 114.jpg' }],
  ])('maps %s', (url, expected) => {
    expect(parseLegacyUrl(url)).toEqual(expected);
  });

  it.each([
    'http://example.com/viewpage.php?page_id=1',
    'mailto:ktos@example.com',
    '#top',
    'register.php',
    'javascript:alert(1)',
  ])('ignores %s', (url) => {
    expect(parseLegacyUrl(url)).toBeNull();
  });

  it('falls back to the listing when the identifier is missing or invalid', () => {
    expect(parseLegacyUrl('viewpage.php?page_id=abc')).toEqual({ kind: 'home' });
    expect(parseLegacyUrl('forum/viewthread.php')).toEqual({ kind: 'forumIndex' });
  });
});

describe('isLegacySiteUrl', () => {
  it('treats relative and legacy-host addresses as internal', () => {
    expect(isLegacySiteUrl('viewpage.php?page_id=1')).toBe(true);
    expect(isLegacySiteUrl('//saintseiya.netserwer.pl/forum/')).toBe(true);
    expect(isLegacySiteUrl('https://example.com/img/a.jpg')).toBe(false);
  });
});
