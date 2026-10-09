import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { newsResource } from '../../server/admin/news';
import { newsCategoriesResource } from '../../server/admin/newsCategories';
import { tagsResource } from '../../server/admin/tags';
import { createComment } from '../../server/utils/communityWrites';
import { schema, useDb } from '../../server/utils/db';
import { createAccount, resetDatabase } from './fixtures';

const validInput = {
  title: 'Soul of Gold — zapowiedź',
  slug: '',
  categoryId: null,
  tagIds: [],
  excerptHtml: '<p onclick="x()">Zajawka<script>alert(1)</script></p>',
  bodyHtml: '',
  status: 'published',
  commentsEnabled: true,
  publishedAt: null,
};

const storedNews = (id: number) => useDb().select().from(schema.news).where(eq(schema.news.id, id)).get()!;

describe('news administration', () => {
  beforeEach(resetDatabase);

  it('creates a news with a generated address, cleaned content and a publication date', () => {
    const editor = createAccount({ role: 'admin' });

    const { id } = newsResource.create(validInput, editor);

    expect(storedNews(id)).toMatchObject({
      slug: 'soul-of-gold-zapowiedz',
      excerptHtml: '<p>Zajawka</p>',
      authorId: editor.id,
      status: 'published',
    });
    expect(storedNews(id).publishedAt).toBeInstanceOf(Date);
  });

  it('keeps addresses unique and away from reserved words', () => {
    const editor = createAccount({ role: 'admin' });
    const first = newsResource.create(validInput, editor);
    const second = newsResource.create(validInput, editor);
    const reserved = newsResource.create({ ...validInput, title: 'Kategoria' }, editor);

    expect(storedNews(first.id).slug).toBe('soul-of-gold-zapowiedz');
    expect(storedNews(second.id).slug).toBe('soul-of-gold-zapowiedz-2');
    expect(storedNews(reserved.id).slug).toBe('kategoria-2');
  });

  it('updates fields and replaces the tag set', () => {
    const editor = createAccount({ role: 'admin' });
    const gold = tagsResource.create({ name: 'Złoci Rycerze', slug: '' }, editor);
    const omega = tagsResource.create({ name: 'Omega', slug: '' }, editor);
    const { id } = newsResource.create({ ...validInput, tagIds: [gold.id] }, editor);

    newsResource.update(
      id,
      { ...validInput, title: 'Nowy tytuł', slug: 'nowy-adres', status: 'draft', tagIds: [omega.id] },
      editor,
    );

    expect(storedNews(id)).toMatchObject({ title: 'Nowy tytuł', slug: 'nowy-adres', status: 'draft' });
    expect(newsResource.find(id)).toMatchObject({ tagIds: [omega.id] });
  });

  it('rejects invalid input with the first problem as the message', () => {
    const editor = createAccount({ role: 'admin' });

    expect(() => newsResource.create({ ...validInput, title: 'A' }, editor)).toThrowError('VALIDATION.TITLE_TOO_SHORT');
    expect(() => newsResource.create({ ...validInput, slug: 'Zły Adres' }, editor)).toThrowError(
      'VALIDATION.SLUG_INVALID',
    );
  });

  it('removes a news together with its comments', () => {
    const editor = createAccount({ role: 'admin' });
    const { id } = newsResource.create(validInput, editor);
    createComment('news', id, editor, '<p>Komentarz</p>');

    newsResource.remove(id, editor);

    expect(newsResource.find(id)).toBeUndefined();
    expect(useDb().select().from(schema.comments).all()).toHaveLength(0);
  });

  it('refuses to remove a category that still has news', () => {
    const editor = createAccount({ role: 'admin' });
    const category = newsCategoriesResource.create({ name: 'Manga', slug: '', image: null }, editor);
    const { id } = newsResource.create({ ...validInput, categoryId: category.id }, editor);

    expect(() => newsCategoriesResource.remove(category.id, editor)).toThrowError('ERRORS.NEWS_CATEGORY_HAS_NEWS');
    expect(storedNews(id).categoryId).toBe(category.id);

    newsResource.remove(id, editor);
    newsCategoriesResource.remove(category.id, editor);

    expect(newsCategoriesResource.find(category.id)).toBeUndefined();
  });

  it('refuses a second tag of the same name, whatever the case of its letters', () => {
    const editor = createAccount({ role: 'admin' });
    const gold = tagsResource.create({ name: 'Złoci Rycerze', slug: '' }, editor);
    const omega = tagsResource.create({ name: 'Omega', slug: '' }, editor);

    expect(() => tagsResource.create({ name: 'ZŁOCI rycerze', slug: '' }, editor)).toThrowError(
      'ERRORS.TAG_NAME_TAKEN',
    );
    expect(() => tagsResource.update(omega.id, { name: 'złoci rycerze', slug: '' }, editor)).toThrowError(
      'ERRORS.TAG_NAME_TAKEN',
    );

    tagsResource.update(gold.id, { name: 'Złoci rycerze', slug: '' }, editor);

    expect(tagsResource.find(gold.id)).toMatchObject({ name: 'Złoci rycerze' });
  });

  it('searches without regard to the case of Polish letters and takes % and _ literally', () => {
    const editor = createAccount({ role: 'admin' });
    newsResource.create({ ...validInput, title: 'Życzenia świąteczne' }, editor);
    newsResource.create({ ...validInput, title: 'Rabat 50% na mangi' }, editor);
    const found = (search: string) =>
      (newsResource.list({ page: 1, search, filter: '' }) as { items: { title: string }[] }).items.map(
        (item) => item.title,
      );

    expect(found('życzenia')).toEqual(['Życzenia świąteczne']);
    expect(found('ŚWIĄT')).toEqual(['Życzenia świąteczne']);
    expect(found('%')).toEqual(['Rabat 50% na mangi']);
    expect(found('_')).toEqual([]);
  });

  it('lists with search and status filter', () => {
    const editor = createAccount({ role: 'admin' });
    newsResource.create(validInput, editor);
    newsResource.create({ ...validInput, title: 'Omega rusza', status: 'draft' }, editor);

    const search = newsResource.list({ page: 1, search: 'omega', filter: '' }) as {
      items: { title: string }[];
      total: number;
    };
    const drafts = newsResource.list({ page: 1, search: '', filter: 'draft' }) as { total: number };
    const everything = newsResource.list({ page: 1, search: '', filter: '' }) as {
      items: { title: string }[];
      total: number;
    };

    expect(search.items.map((news) => news.title)).toEqual(['Omega rusza']);
    expect(drafts.total).toBe(1);
    expect(everything.total).toBe(2);
    expect(everything.items[0]!.title).toBe('Omega rusza');
  });
});
