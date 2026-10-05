import { beforeEach, describe, expect, it } from 'vitest';
import { faqCategoriesResource } from '../../server/admin/directory/faqCategories';
import { faqItemsResource } from '../../server/admin/directory/faqItems';
import { listFaq } from '../../server/utils/faq';
import { searchSite } from '../../server/utils/search';
import { createAccount, resetDatabase } from './fixtures';

const EVERYTHING = { page: 1, search: '', filter: '' };

const admin = () => createAccount({ role: 'admin' });

const createCategory = (name: string, sortOrder = 0) => faqCategoriesResource.create({ name, sortOrder }, admin());

const createItem = (categoryId: number, title: string, sortOrder = 0, descriptionHtml = '<p>Odpowiedź</p>') =>
  faqItemsResource.create({ title, descriptionHtml, categoryId, sortOrder }, admin());

const listedTitles = (query: Partial<typeof EVERYTHING> = {}) =>
  (faqItemsResource.list({ ...EVERYTHING, ...query }) as { items: { title: string }[] }).items.map(
    (item) => item.title,
  );

describe('FAQ', () => {
  beforeEach(resetDatabase);

  it('publishes questions under their categories in the set order, without empty categories', () => {
    const forum = createCategory('Forum', 10);
    const site = createCategory('Strona', 0);
    createCategory('Pusta kategoria', 20);
    createItem(forum.id, 'Jakie są rangi na forum?');
    createItem(site.id, 'Kto zarządza stroną?', 10);
    createItem(
      site.id,
      'Strona nie działa. Co robić?',
      0,
      '<p onclick="x()">Nie panikuj.</p><script>alert(1)</script>',
    );

    expect(listFaq()).toEqual([
      {
        id: site.id,
        name: 'Strona',
        items: [
          { id: expect.any(Number), title: 'Strona nie działa. Co robić?', descriptionHtml: '<p>Nie panikuj.</p>' },
          { id: expect.any(Number), title: 'Kto zarządza stroną?', descriptionHtml: '<p>Odpowiedź</p>' },
        ],
      },
      { id: forum.id, name: 'Forum', items: [expect.objectContaining({ title: 'Jakie są rangi na forum?' })] },
    ]);
  });

  it('keeps the English version next to the Polish one', () => {
    const editor = admin();
    const category = createCategory('Strona');
    const item = createItem(category.id, 'Kto zarządza stroną?', 0, '<p>Redakcja.</p>');

    faqCategoriesResource.update(category.id, { name: 'Website', sortOrder: 0 }, editor, 'en');
    faqItemsResource.update(
      item.id,
      { title: 'Who runs the site?', descriptionHtml: '<p>The editors.</p>', categoryId: category.id, sortOrder: 5 },
      editor,
      'en',
    );

    expect(listFaq()).toMatchObject([
      { name: 'Strona', items: [{ title: 'Kto zarządza stroną?', descriptionHtml: '<p>Redakcja.</p>' }] },
    ]);
    expect(listFaq('en')).toMatchObject([
      { name: 'Website', items: [{ title: 'Who runs the site?', descriptionHtml: '<p>The editors.</p>' }] },
    ]);
    expect(faqItemsResource.find(item.id)).toMatchObject({ title: 'Kto zarządza stroną?', sortOrder: 5 });
  });

  it('is found by the site search in the requested language, with a link to the question', () => {
    const editor = admin();
    const category = createCategory('Forum');
    const item = createItem(
      category.id,
      'Czym są ostrzeżenia?',
      0,
      '<p>Lżejszą formą <strong>egzekwowania</strong> regulaminu.</p>',
    );
    createItem(category.id, 'Czemu zostałem zbanowany?');
    faqItemsResource.update(
      item.id,
      {
        title: 'What are warnings?',
        descriptionHtml: '<p>A lighter penalty.</p>',
        categoryId: category.id,
        sortOrder: 0,
      },
      editor,
      'en',
    );

    expect(searchSite('OSTRZEŻ').faq).toEqual([
      {
        title: 'Czym są ostrzeżenia?',
        url: `/faq#pytanie-${item.id}`,
        excerpt: 'Lżejszą formą egzekwowania regulaminu.',
        context: 'FAQ · Forum',
      },
    ]);
    expect(searchSite('egzekwowania').faq).toHaveLength(1);
    expect(searchSite('penalty').faq).toEqual([]);
    expect(searchSite('penalty', 'en').faq).toMatchObject([{ title: 'What are warnings?' }]);
  });

  it('requires an existing category, filters the list and keeps a category while it has questions', () => {
    const editor = admin();
    const site = createCategory('Strona');
    const forum = createCategory('Forum', 10);
    const item = createItem(site.id, 'Kto zarządza stroną?');
    createItem(forum.id, 'Czym są ostrzeżenia?');

    expect(() => createItem(forum.id + 1, 'Pytanie bez kategorii')).toThrowError('VALIDATION.CATEGORY_REQUIRED');
    expect(listedTitles()).toEqual(['Kto zarządza stroną?', 'Czym są ostrzeżenia?']);
    expect(listedTitles({ search: 'ostrze' })).toEqual(['Czym są ostrzeżenia?']);
    expect(listedTitles({ filter: String(site.id) })).toEqual(['Kto zarządza stroną?']);
    expect(() => faqCategoriesResource.remove(site.id, editor)).toThrowError('ERRORS.FAQ_CATEGORY_HAS_ITEMS');

    faqItemsResource.remove(item.id, editor);
    faqCategoriesResource.remove(site.id, editor);

    expect(listFaq().map((category) => category.name)).toEqual(['Forum']);
  });
});
