import { beforeEach, describe, expect, it } from 'vitest';
import { homeContent } from '../../server/utils/home';
import { findPublishedNews, listNewsCategories, listPublishedNews } from '../../server/utils/news';
import { findPublishedPage } from '../../server/utils/pages';
import { createAccount, createNews, createNewsCategory, createPage, resetDatabase } from './fixtures';

describe('news reading', () => {
  beforeEach(resetDatabase);

  it('lists published news newest first, without drafts', () => {
    const author = createAccount({ name: 'Verien', isGhost: true });
    createNews(author.id, { title: 'Starszy', publishedAt: new Date(2015, 0, 1) });
    createNews(author.id, { title: 'Nowszy', publishedAt: new Date(2019, 0, 1), bodyHtml: '<p>Rozwinięcie</p>' });
    createNews(author.id, { title: 'Szkic', status: 'draft' });

    const listed = listPublishedNews({ page: 1 });

    expect(listed.items.map((news) => news.title)).toEqual(['Nowszy', 'Starszy']);
    expect(listed.items[0]).toMatchObject({
      teaser: 'Zajawka',
      commentCount: 0,
      author: { name: 'Verien', isGhost: true },
    });
  });

  it('lists a short plain-text teaser instead of the whole excerpt', () => {
    const author = createAccount();
    const longExcerpt = `<p><img src="/media/a.jpg" alt="" /><strong>Rycerze</strong> ${'Zodiaku wracają. '.repeat(40)}</p>`;
    createNews(author.id, { title: 'Długi', excerptHtml: longExcerpt, publishedAt: new Date(2019, 0, 1) });
    createNews(author.id, {
      title: 'Sam obrazek',
      excerptHtml: '<p><img src="/media/a.jpg" alt="" /></p>',
      bodyHtml: '<p>Rozwinięcie</p>',
      publishedAt: new Date(2015, 0, 1),
    });

    const [long, imageOnly] = listPublishedNews({ page: 1 }).items;

    expect(long!.teaser).toMatch(/^Rycerze Zodiaku wracają\. .*(?:Zodiaku|wracają)…$/);
    expect(long!.teaser.length).toBeLessThanOrEqual(261);
    expect(long).not.toHaveProperty('excerptHtml');
    expect(imageOnly!.teaser).toBe('Rozwinięcie');
  });

  it('filters by category and paginates', () => {
    const author = createAccount();
    const manga = createNewsCategory('Manga');
    createNews(author.id, { title: 'O mandze', categoryId: manga.id });
    createNews(author.id, { title: 'Inne' });
    createNews(author.id, { title: 'Jeszcze inne' });

    expect(listPublishedNews({ page: 1, categorySlug: manga.slug }).items.map((news) => news.title)).toEqual([
      'O mandze',
    ]);
    expect(listPublishedNews({ page: 2 }, 2)).toMatchObject({ page: 2, pageCount: 2, total: 3 });
    expect(listNewsCategories().find((category) => category.slug === manga.slug)?.newsCount).toBe(1);
  });

  it('shows the six newest published news on the home page', () => {
    const author = createAccount();
    const titles = Array.from({ length: 8 }, (_, index) => `News z dnia ${index + 1}`);
    titles.forEach((title, index) => createNews(author.id, { title, publishedAt: new Date(2021, 4, index + 1) }));
    createNews(author.id, { title: 'Szkic', status: 'draft', publishedAt: new Date(2022, 0, 1) });

    expect(homeContent().latestNews.map((news) => news.title)).toEqual(titles.toReversed().slice(0, 6));
  });

  it('finds a published news by its address and hides drafts', () => {
    const author = createAccount();
    const published = createNews(author.id, { slug: 'powrot-ssr' });
    createNews(author.id, { slug: 'tajny-szkic', status: 'draft' });

    expect(findPublishedNews('powrot-ssr')).toMatchObject({ id: published.id, tags: [] });
    expect(findPublishedNews('tajny-szkic')).toBeNull();
    expect(findPublishedNews('nie-ma')).toBeNull();
  });

  it('leaves the excerpt out when the body already opens with it', () => {
    const author = createAccount();
    const lead = 'Postanowiliśmy wyjść naprzeciw wszystkim poszukującym ciekawostek o rycerzach.';
    createNews(author.id, {
      slug: 'powtorzona-zajawka',
      excerptHtml: `<p><strong>${lead}</strong></p>`,
      bodyHtml: `<p>${lead}</p><p>Dalszy ciąg newsa.</p>`,
    });
    createNews(author.id, {
      slug: 'osobna-zajawka',
      excerptHtml: '<p>Krótka zapowiedź.</p>',
      bodyHtml: '<p>Pełna treść o czymś innym.</p>',
    });

    expect(findPublishedNews('powtorzona-zajawka')).toMatchObject({ excerptHtml: '' });
    expect(findPublishedNews('osobna-zajawka')).toMatchObject({ excerptHtml: '<p>Krótka zapowiedź.</p>' });
  });
});

describe('page reading', () => {
  beforeEach(resetDatabase);

  it('returns a page with its breadcrumbs and published children in order', () => {
    const root = createPage({ path: 'mitologia', title: 'Mitologia', kind: 'hub', bodyHtml: '' });
    const greek = createPage({ path: 'mitologia/grecka', title: 'Grecka', parentId: root.id });
    createPage({ path: 'mitologia/grecka/zeus', title: 'Zeus', parentId: greek.id, sortOrder: 2 });
    createPage({ path: 'mitologia/grecka/hera', title: 'Hera', parentId: greek.id, sortOrder: 1 });
    createPage({ path: 'mitologia/grecka/szkic', title: 'Szkic', parentId: greek.id, status: 'draft' });

    const page = findPublishedPage('mitologia/grecka')!;

    expect(page.breadcrumbs).toEqual([{ title: 'Mitologia', path: 'mitologia' }]);
    expect(page.children.map((child) => child.title)).toEqual(['Hera', 'Zeus']);
    expect(findPublishedPage('mitologia')!.children).toEqual([
      { title: 'Grecka', path: 'mitologia/grecka', kind: 'article', childCount: 2 },
    ]);
  });

  it('leaves draft ancestors out of the breadcrumbs', () => {
    const draftHub = createPage({ path: 'redakcja', title: 'Redakcja', kind: 'hub', status: 'draft' });
    createPage({ path: 'redakcja/zasady', title: 'Zasady', parentId: draftHub.id });

    expect(findPublishedPage('redakcja/zasady')!.breadcrumbs).toEqual([]);
  });

  it('does not expose drafts or unknown addresses', () => {
    createPage({ path: 'ataki', status: 'draft' });

    expect(findPublishedPage('ataki')).toBeNull();
    expect(findPublishedPage('nie-ma')).toBeNull();
  });
});
