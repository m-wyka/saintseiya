import { beforeEach, describe, expect, it } from 'vitest';
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
      hasBody: true,
      commentCount: 0,
      author: { name: 'Verien', isGhost: true },
    });
    expect(listed.items[1]!.hasBody).toBe(false);
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

  it('finds a published news by its address and hides drafts', () => {
    const author = createAccount();
    const published = createNews(author.id, { slug: 'powrot-ssr' });
    createNews(author.id, { slug: 'tajny-szkic', status: 'draft' });

    expect(findPublishedNews('powrot-ssr')).toMatchObject({ id: published.id, tags: [] });
    expect(findPublishedNews('tajny-szkic')).toBeNull();
    expect(findPublishedNews('nie-ma')).toBeNull();
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
