import { getTableName } from 'drizzle-orm';
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';
import { beforeEach, describe, expect, it } from 'vitest';
import { schema, useDb } from '../../server/utils/db';
import { homeContent } from '../../server/utils/home';
import { siteLayout } from '../../server/utils/layout';
import { findPublishedMap, listPublishedMaps } from '../../server/utils/maps';
import { findPublishedNews, listNewsCategories, listPublishedNews } from '../../server/utils/news';
import { findPublishedPage } from '../../server/utils/pages';
import { searchSite } from '../../server/utils/search';
import { routes } from '../../shared/utils/routes';
import { createAccount, createNews, createNewsCategory, createPage, resetDatabase } from './fixtures';

const translate = (column: SQLiteColumn, entityId: number, value: string) =>
  useDb()
    .insert(schema.translations)
    .values({ entity: getTableName(column.table), entityId, field: column.name, locale: 'en', value })
    .run();

describe('translated public content', () => {
  beforeEach(() => {
    resetDatabase();
    useDb().delete(schema.translations).run();
  });

  it('translates news in the list and on its own page, falling back to Polish', () => {
    const author = createAccount();
    const category = createNewsCategory('Manga po polsku');
    const tag = useDb().insert(schema.tags).values({ slug: 'rycerze', name: 'Rycerze' }).returning().get();
    const news = createNews(author.id, {
      slug: 'powrot',
      title: 'Powrót',
      excerptHtml: '<p>Zajawka</p>',
      bodyHtml: '<p>Treść</p>',
      categoryId: category.id,
    });
    useDb().insert(schema.newsTags).values({ newsId: news.id, tagId: tag.id }).run();
    const uncategorised = createNews(author.id, { slug: 'bez-kategorii', title: 'Bez kategorii' });
    translate(schema.news.title, news.id, 'The Return');
    translate(schema.news.bodyHtml, news.id, '<p>Body</p>');
    translate(schema.news.excerptHtml, uncategorised.id, '<p>Only English teaser</p>');
    translate(schema.newsCategories.name, category.id, 'Manga in English');
    translate(schema.tags.name, tag.id, 'Knights');

    expect(findPublishedNews('powrot')).toMatchObject({
      title: 'Powrót',
      bodyHtml: '<p>Treść</p>',
      category: { slug: category.slug, name: 'Manga po polsku' },
      tags: [{ slug: 'rycerze', name: 'Rycerze' }],
    });
    expect(findPublishedNews('powrot', 'en')).toMatchObject({
      id: news.id,
      title: 'The Return',
      excerptHtml: '<p>Zajawka</p>',
      bodyHtml: '<p>Body</p>',
      category: { slug: category.slug, name: 'Manga in English', image: null },
      tags: [{ slug: 'rycerze', name: 'Knights' }],
    });

    const polish = listPublishedNews({ page: 1 }).items;
    const english = listPublishedNews({ page: 1 }, undefined, 'en').items;
    expect(polish.map((item) => [item.title, item.teaser, item.category?.name ?? null])).toEqual([
      ['Bez kategorii', 'Zajawka', null],
      ['Powrót', 'Zajawka', 'Manga po polsku'],
    ]);
    expect(english.map((item) => [item.title, item.teaser, item.category])).toEqual([
      ['Bez kategorii', 'Only English teaser', null],
      ['The Return', 'Zajawka', { slug: category.slug, name: 'Manga in English', image: null }],
    ]);
    expect(listNewsCategories('en')).toEqual([
      { slug: category.slug, name: 'Manga in English', image: null, newsCount: 1 },
    ]);
    expect(listNewsCategories()[0]!.name).toBe('Manga po polsku');
  });

  it('translates a page with its breadcrumbs and children', () => {
    const root = createPage({ path: 'mitologia', title: 'Mitologia', kind: 'hub' });
    const greek = createPage({
      path: 'mitologia/grecka',
      title: 'Grecka',
      bodyHtml: '<p>Bogowie</p>',
      parentId: root.id,
    });
    const zeus = createPage({ path: 'mitologia/grecka/zeus', title: 'Zeus Gromowładny', parentId: greek.id });
    createPage({ path: 'mitologia/grecka/hera', title: 'Hera', parentId: greek.id, sortOrder: 1 });
    translate(schema.pages.title, root.id, 'Mythology');
    translate(schema.pages.title, greek.id, 'Greek');
    translate(schema.pages.bodyHtml, greek.id, '<p>Gods</p>');
    translate(schema.pages.title, zeus.id, 'Zeus the Thunderer');

    expect(findPublishedPage('mitologia/grecka')).toMatchObject({
      title: 'Grecka',
      bodyHtml: '<p>Bogowie</p>',
      breadcrumbs: [{ title: 'Mitologia', path: 'mitologia' }],
    });
    const english = findPublishedPage('mitologia/grecka', 'en')!;
    expect(english).toMatchObject({ id: greek.id, title: 'Greek', bodyHtml: '<p>Gods</p>' });
    expect(english.breadcrumbs).toEqual([{ title: 'Mythology', path: 'mitologia' }]);
    expect(english.children.map((child) => [child.title, child.childCount])).toEqual([
      ['Zeus the Thunderer', 0],
      ['Hera', 0],
    ]);
    expect(findPublishedPage('mitologia', 'en')!.children).toEqual([
      { title: 'Greek', path: 'mitologia/grecka', kind: 'article', childCount: 2 },
    ]);
  });

  it('translates a map with its areas and the navigation of the layout', () => {
    const db = useDb();
    const map = db
      .insert(schema.maps)
      .values({
        slug: 'sanktuarium',
        title: 'Sanktuarium',
        description: 'Dwanaście domów',
        image: 'maps/sanktuarium.webp',
        imageWidth: 1000,
        imageHeight: 800,
        status: 'published',
      })
      .returning()
      .get();
    const frame = { mapId: map.id, leftPercent: 10, topPercent: 20, widthPercent: 30, heightPercent: 15 };
    const [described, linked] = db
      .insert(schema.mapAreas)
      .values([
        { ...frame, label: 'Dom Barana', targetKind: 'content', contentHtml: '<p>Mu</p>', sortOrder: 0 },
        { ...frame, label: 'Forum', targetKind: 'url', url: '/forum', sortOrder: 1 },
      ])
      .returning()
      .all();
    const section = db.insert(schema.navigationSections).values({ title: 'Świat', sortOrder: 0 }).returning().get();
    const [translatedLink] = db
      .insert(schema.navigationLinks)
      .values([
        { sectionId: section.id, groupTitle: 'Bogowie', label: 'Atena', url: '/atena', sortOrder: 0 },
        { sectionId: section.id, label: 'Hades', url: '/hades', sortOrder: 1 },
      ])
      .returning()
      .all();
    translate(schema.maps.title, map.id, 'Sanctuary');
    translate(schema.maps.image, map.id, 'maps/sanctuary.webp');
    translate(schema.mapAreas.label, described!.id, 'House of Aries');
    translate(schema.mapAreas.contentHtml, described!.id, '<p>Mu of Aries</p>');
    translate(schema.navigationSections.title, section.id, 'World');
    translate(schema.navigationLinks.groupTitle, translatedLink!.id, 'Gods');
    translate(schema.navigationLinks.label, translatedLink!.id, 'Athena');

    expect(findPublishedMap('sanktuarium')).toMatchObject({
      title: 'Sanktuarium',
      image: 'maps/sanktuarium.webp',
      areas: [{ label: 'Dom Barana', contentHtml: '<p>Mu</p>' }, { label: 'Forum' }],
    });
    expect(findPublishedMap('sanktuarium', 'en')).toMatchObject({
      slug: 'sanktuarium',
      title: 'Sanctuary',
      description: 'Dwanaście domów',
      image: 'maps/sanctuary.webp',
      imageWidth: 1000,
      areas: [
        { id: described!.id, label: 'House of Aries', link: null, contentHtml: '<p>Mu of Aries</p>' },
        { id: linked!.id, label: 'Forum', link: '/forum', contentHtml: null },
      ],
    });
    expect(listPublishedMaps('en')).toEqual([
      {
        slug: 'sanktuarium',
        title: 'Sanctuary',
        description: 'Dwanaście domów',
        image: 'maps/sanctuary.webp',
        teaserImage: null,
      },
    ]);

    const menuOf = (layout: ReturnType<typeof siteLayout>) =>
      layout.navigation.map((entry) => [
        entry.title,
        entry.links.map((link) => [link.groupTitle, link.label, link.url]),
      ]);
    expect(menuOf(siteLayout())).toEqual([
      [
        'Świat',
        [
          ['Bogowie', 'Atena', '/atena'],
          [null, 'Hades', '/hades'],
        ],
      ],
    ]);
    expect(menuOf(siteLayout('en'))).toEqual([
      [
        'World',
        [
          ['Gods', 'Athena', '/atena'],
          [null, 'Hades', '/hades'],
        ],
      ],
    ]);
    expect(siteLayout('en').maps.map((listed) => listed.title)).toEqual(['Sanctuary']);
  });

  it('searches the text of the requested language', () => {
    const author = createAccount();
    const news = createNews(author.id, { slug: 'zbroje', title: 'Złote zbroje', bodyHtml: '<p>Dwanaście zbroi</p>' });
    const page = createPage({ path: 'pegaz', title: 'Pegaz', bodyHtml: '<p>Meteor Pegaza</p>' });
    createPage({ path: 'smok', title: 'Smok', bodyHtml: '<p>Kolejny meteor</p>' });
    translate(schema.news.bodyHtml, news.id, '<p>Twelve golden cloths</p>');
    translate(schema.pages.title, page.id, 'Pegasus');
    translate(schema.pages.bodyHtml, page.id, '<p>Pegasus comet fist</p>');

    expect(searchSite('cloths').news).toEqual([]);
    expect(searchSite('pegasus').pages).toEqual([]);
    expect(searchSite('cloths', 'en').news).toEqual([
      { title: 'Złote zbroje', url: routes.news('zbroje'), excerpt: 'Zajawka Twelve golden cloths', context: 'News' },
    ]);
    expect(searchSite('PEGASUS', 'en').pages).toMatchObject([{ title: 'Pegasus', excerpt: 'Pegasus comet fist' }]);
    expect(searchSite('meteor', 'en').pages.map((found) => found.title)).toEqual(['Smok']);
    expect(searchSite('meteor').pages.map((found) => found.title)).toEqual(['Pegaz', 'Smok']);
  });

  it('names comment targets on the home page in the requested language', () => {
    const author = createAccount();
    const news = createNews(author.id, { title: 'Powrót' });
    useDb()
      .insert(schema.comments)
      .values({ targetKind: 'news', targetId: news.id, authorId: author.id, bodyHtml: '<p>Super</p>' })
      .run();
    translate(schema.news.title, news.id, 'The Return');

    expect(homeContent().latestComments.map((comment) => comment.target.title)).toEqual(['Powrót']);
    expect(homeContent('en').latestComments.map((comment) => comment.target.title)).toEqual(['The Return']);
  });
});
