import { beforeEach, describe, expect, it } from 'vitest';
import { schema, useDb } from '../../server/utils/db';
import { listSitemapEntries, newsFeedXml, robotsText, sitemapXml } from '../../server/utils/feeds';
import { createThread, replyToThread } from '../../server/utils/forumWrites';
import { looksLikeLegacyRequest, resolveLegacyTarget } from '../../server/utils/legacyRedirects';
import { findProfile } from '../../server/utils/profiles';
import { searchSite } from '../../server/utils/search';
import { parseLegacyUrl } from '../../shared/utils/legacyUrls';
import { createAccount, createForum, createNews, createPage, resetDatabase } from './fixtures';

const redirectFor = (legacyUrl: string): string => resolveLegacyTarget(parseLegacyUrl(legacyUrl)!);

describe('legacy address redirects', () => {
  beforeEach(resetDatabase);

  it('recognises only requests that look like the old site', () => {
    expect(looksLikeLegacyRequest('/viewpage.php')).toBe(true);
    expect(looksLikeLegacyRequest('/forum/viewthread.php')).toBe(true);
    expect(looksLikeLegacyRequest('/kr/')).toBe(true);
    expect(looksLikeLegacyRequest('/posejdon.html')).toBe(true);
    expect(looksLikeLegacyRequest('/img/niebo/1s.jpg')).toBe(true);
    expect(looksLikeLegacyRequest('/forum')).toBe(false);
    expect(looksLikeLegacyRequest('/mapy/mapa-nieba')).toBe(false);
    expect(looksLikeLegacyRequest('/api/news')).toBe(false);
  });

  it('sends old content addresses to the migrated content', () => {
    const author = createAccount();
    createPage({ path: 'mitologia/grecka', legacyId: 335 });
    createNews(author.id, { slug: 'powrot', legacyId: 409 });
    const forum = createForum();
    const { threadId, postId } = createThread(forum, author, 'Temat', '<p>A</p>');
    useDb().update(schema.forums).set({ legacyId: 43 }).run();
    useDb().update(schema.threads).set({ legacyId: 126 }).run();
    useDb().update(schema.posts).set({ legacyId: 1582 }).run();

    expect(redirectFor('/viewpage.php?page_id=335')).toBe('/mitologia/grecka');
    expect(redirectFor('/viewpage.php?page_id=761')).toBe('/faq');
    expect(redirectFor('/news.php?readmore=409')).toBe('/newsy/powrot');
    expect(redirectFor('/forum/viewforum.php?forum_id=43')).toBe(`/forum/dzial/${forum.slug}`);
    expect(redirectFor('/forum/viewthread.php?thread_id=126')).toBe(`/forum/temat/${threadId}`);
    expect(redirectFor('/forum/viewthread.php?thread_id=126&pid=1582')).toBe(`/forum/post/${postId}`);
    expect(redirectFor('/kr/index.html')).toBe('/mapy/krolestwo-umarlych');
    expect(redirectFor('/img/niebo/1s.jpg')).toBe('/media/legacy/img/niebo/1s.jpg');
  });

  it('falls back to the section when the content is missing or hidden', () => {
    const author = createAccount();
    createPage({ path: 'ataki', legacyId: 40, status: 'draft' });
    createNews(author.id, { legacyId: 5, status: 'draft' });

    expect(redirectFor('/viewpage.php?page_id=40')).toBe('/');
    expect(redirectFor('/viewpage.php?page_id=9999')).toBe('/');
    expect(redirectFor('/news.php?readmore=5')).toBe('/newsy');
    expect(redirectFor('/forum/viewthread.php?thread_id=77')).toBe('/forum');
    expect(redirectFor('/photogallery.php?photo_id=1')).toBe('/galeria');
  });
});

describe('site search', () => {
  beforeEach(resetDatabase);

  it('finds published pages, news and public forum posts regardless of letter case', () => {
    const author = createAccount();
    createPage({ path: 'labedz', title: 'Łabędź', bodyHtml: '<p>Gwiazdozbiór <strong>Łabędzia</strong> i Hyoga.</p>' });
    createPage({ path: 'szkic', title: 'Szkic o łabędziach', status: 'draft' });
    createNews(author.id, { title: 'Nowy odcinek', excerptHtml: '<p>Rycerz ŁABĘDZIA wraca</p>' });
    createThread(createForum(), author, 'Ulubiony rycerz', '<p>Zdecydowanie łabędź!</p>');
    createThread(
      createForum({ isStaffOnly: true }),
      createAccount({ role: 'admin' }),
      'Tajne',
      '<p>łabędź w redakcji</p>',
    );

    const results = searchSite('łabęd');

    expect(results.pages.map((page) => page.title)).toEqual(['Łabędź']);
    expect(results.pages[0]!.excerpt).toContain('Gwiazdozbiór Łabędzia');
    expect(results.news.map((news) => news.title)).toEqual(['Nowy odcinek']);
    expect(results.forum.map((post) => post.title)).toEqual(['Ulubiony rycerz']);
  });

  it('searches the visible text, not the markup', () => {
    createPage({
      path: 'ilustracja',
      title: 'Ilustracja',
      bodyHtml: '<p>Seiya &amp; Shiryu <strong>ra</strong>zem</p><img src="/media/a.jpg" alt="" loading="lazy" />',
    });

    expect(searchSite('lazy').pages).toEqual([]);
    expect(searchSite('strong').pages).toEqual([]);
    expect(searchSite('Seiya & Shiryu').pages).toHaveLength(1);
    expect(searchSite('razem').pages).toHaveLength(1);
  });

  it('ignores too short phrases and treats wildcard characters literally', () => {
    createPage({ path: 'procent', title: 'Sto procent', bodyHtml: '<p>100% cosmo</p>' });

    expect(searchSite('ab').pages).toEqual([]);
    expect(searchSite('100%').pages).toHaveLength(1);
    expect(searchSite('1_0%').pages).toEqual([]);
  });
});

describe('sitemap and news feed', () => {
  const siteUrl = 'https://example.com';

  beforeEach(resetDatabase);

  it('lists public addresses in both languages and leaves out drafts and staff sections', () => {
    const author = createAccount();
    createPage({ path: 'mitologia/newsy' });
    createPage({ path: 'szkic', status: 'draft' });
    createNews(author.id, { slug: 'galeria' });
    createNews(author.id, { slug: 'ukryty', status: 'draft' });
    const { threadId } = createThread(createForum(), author, 'Temat', '<p>A</p>');
    const staffThread = createThread(
      createForum({ isStaffOnly: true }),
      createAccount({ role: 'admin' }),
      'Tajne',
      '<p>B</p>',
    );

    const xml = sitemapXml(listSitemapEntries(), siteUrl);

    expect(xml).toContain('<loc>https://example.com/</loc>');
    expect(xml).toContain('<loc>https://example.com/en</loc>');
    expect(xml).toContain('<loc>https://example.com/newsy/galeria</loc>');
    expect(xml).toContain('<loc>https://example.com/en/news/galeria</loc>');
    expect(xml).toContain('<loc>https://example.com/en/mitologia/newsy</loc>');
    expect(xml).toContain(`<loc>https://example.com/en/forum/thread/${threadId}</loc>`);
    expect(xml).toContain('hreflang="en" href="https://example.com/en/faq"');
    expect(xml).not.toContain('szkic');
    expect(xml).not.toContain('ukryty');
    expect(xml).not.toContain(`/forum/temat/${staffThread.threadId}<`);
  });

  it('feeds the newest published news with escaped text and links in the language of the feed', () => {
    const author = createAccount();
    createNews(author.id, {
      slug: 'seiya-i-shiryu',
      title: 'Seiya & Shiryu',
      excerptHtml: '<p>Zajawka <strong>newsa</strong></p>',
      publishedAt: new Date('2024-03-05T12:00:00Z'),
    });
    createNews(author.id, { slug: 'ukryty', status: 'draft' });

    const polishFeed = newsFeedXml('pl', siteUrl, 'Saint Seiya Revolution');
    const englishFeed = newsFeedXml('en', siteUrl, 'Saint Seiya Revolution');

    expect(polishFeed).toContain('<title>Saint Seiya Revolution — Newsy</title>');
    expect(polishFeed).toContain('<title>Seiya &amp; Shiryu</title>');
    expect(polishFeed).toContain('<link>https://example.com/newsy/seiya-i-shiryu</link>');
    expect(polishFeed).toContain('<pubDate>Tue, 05 Mar 2024 12:00:00 GMT</pubDate>');
    expect(polishFeed).toContain('<description>Zajawka newsa</description>');
    expect(polishFeed).not.toContain('ukryty');
    expect(englishFeed).toContain('<link>https://example.com/en/news/seiya-i-shiryu</link>');
    expect(englishFeed).toContain('<atom:link href="https://example.com/en/rss.xml"');
  });

  it('points robots at the sitemap and keeps them out of the panel', () => {
    expect(robotsText(siteUrl)).toContain('Sitemap: https://example.com/sitemap.xml');
    expect(robotsText(siteUrl)).toContain('Disallow: /admin');
  });
});

describe('profiles', () => {
  beforeEach(resetDatabase);

  it('summarises an author without exposing staff-only activity', () => {
    const author = createAccount({ name: 'Hekate', isGhost: true });
    const { threadId } = createThread(createForum(), author, 'Publiczny temat', '<p>Pierwszy <em>post</em></p>');
    replyToThread(threadId, author, '<p>Drugi post</p>');
    createThread(createForum({ isStaffOnly: true }), createAccount({ role: 'admin' }), 'Tajny', '<p>X</p>');

    const profile = findProfile(author.id)!;

    expect(profile).toMatchObject({ name: 'Hekate', isGhost: true, createdAt: null, postCount: 2, commentCount: 0 });
    expect(profile.latestPosts).toHaveLength(2);
    expect(profile.latestPosts.map((post) => post.excerpt).sort()).toEqual(['Drugi post', 'Pierwszy post']);
    expect(findProfile(999_999)).toBeNull();
  });
});
