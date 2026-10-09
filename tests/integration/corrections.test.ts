import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  applyContentCorrections,
  FAQ_ACCOUNT_CATEGORY,
  FAQ_ACCOUNT_QUESTIONS,
  FAQ_RETIRED_QUESTIONS,
  PAGE_TITLE_CORRECTIONS,
} from '../../scripts/legacy/corrections';
import { schema, useDb } from '../../server/utils/db';
import { resetDatabase } from './fixtures';

const ZEW_KRWI = 'fan-fiction/lamia/zew-krwi';
const ROMAN_GODS = 'mitologia/rzymska/bogowie';
const MISPLACED_HUB = 'mitologia/rzymska/rzymska-bogowie';
const GREEK = 'mitologia/grecka';

const addPage = (path: string, values: Partial<typeof schema.pages.$inferInsert> = {}) => {
  const parentPath = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : null;
  const parent = parentPath
    ? useDb().select().from(schema.pages).where(eq(schema.pages.path, parentPath)).get()
    : undefined;
  return useDb()
    .insert(schema.pages)
    .values({
      slug: path.slice(path.lastIndexOf('/') + 1),
      path,
      title: path,
      status: 'published',
      parentId: parent?.id ?? null,
      ...values,
    })
    .returning()
    .get();
};

const seedLegacyTree = () => {
  addPage('mitologia', { kind: 'hub' });
  addPage(GREEK, { title: 'Grecka' });
  addPage(`${GREEK}/literatura`, { bodyHtml: '<p><img src="https://example.com/baner.jpg" alt="" /></p>' });
  addPage(`${GREEK}/muzy`, { bodyHtml: '<p>Dziewięć córek Zeusa.</p>' });
  addPage('mitologia/rzymska', { title: 'Rzymska' });
  addPage(ROMAN_GODS, { kind: 'hub' });
  addPage(`${ROMAN_GODS}/jowisz`, { sortOrder: 0 });
  addPage(`${ROMAN_GODS}/boginie-rzymskie`, { sortOrder: 1 });
  addPage(`${ROMAN_GODS}/prozerpina`, { sortOrder: 2 });
  addPage(`${ROMAN_GODS}/jowisz-2`, { sortOrder: 3, title: 'Jowisz' });
  addPage(MISPLACED_HUB, { kind: 'hub', title: 'Rzymska- Bogowie' });
  addPage(`${MISPLACED_HUB}/pluton`, { title: 'Pluton' });
  addPage('fan-fiction', { kind: 'hub' });
  addPage('fan-fiction/lamia', { kind: 'hub' });
  addPage(ZEW_KRWI, { kind: 'hub' });
  addPage(`${ZEW_KRWI}/1`, { sortOrder: 0, title: '1' });
  addPage(`${ZEW_KRWI}/2`, { sortOrder: 1, title: '2' });
  addPage(`${ZEW_KRWI}/2/3`, { title: '3' });
  addPage(`${ZEW_KRWI}/4`, { sortOrder: 2, title: '4' });
  addPage('regulamin', {
    title: 'Regulamin',
    bodyHtml: [
      `<p><a href="/${MISPLACED_HUB}/pluton">Pluton</a> i <a href="/${ROMAN_GODS}/jowisz-2#opis">Mars</a>,`,
      `<a href="/${ROMAN_GODS}/jowisz">Jowisz</a>, <a href="/${ZEW_KRWI}/2">część druga</a>,`,
      `<a href="/${ZEW_KRWI}/2/3">część trzecia</a>, a w tekście /${ROMAN_GODS}/jowisz-2 bez odnośnika.</p>`,
    ].join(' '),
  });
};

const seedLegacyContent = () => {
  const db = useDb();
  seedLegacyTree();
  const section = db.insert(schema.navigationSections).values({ title: 'Mitologia' }).returning().get();
  db.insert(schema.navigationLinks)
    .values([
      { sectionId: section.id, label: 'Mars', url: `/${ROMAN_GODS}/jowisz-2` },
      { sectionId: section.id, label: 'Jowisz', url: `/${ROMAN_GODS}/jowisz` },
    ])
    .run();
  db.insert(schema.newsCategories)
    .values({ slug: 'aktuzlizacje-dotyczace-zawartosci-strony', name: 'Aktuzlizacje dotyczące zawartości strony!' })
    .run();
  const category = db.insert(schema.faqCategories).values({ name: FAQ_ACCOUNT_CATEGORY.legacyName }).returning().get();
  const retired = db
    .insert(schema.faqItems)
    .values({ categoryId: category.id, title: FAQ_RETIRED_QUESTIONS[0]!, descriptionHtml: '<p>PW</p>' })
    .returning()
    .get();
  db.insert(schema.faqItems)
    .values([
      { categoryId: category.id, title: 'Zapomniałem hasła.', descriptionHtml: '<p>Kliknij ikonkę.</p>', sortOrder: 5 },
      { categoryId: category.id, title: 'Kto zarządza stroną?', descriptionHtml: '<p>Redakcja.</p>', sortOrder: 7 },
      {
        categoryId: category.id,
        title: 'Czym są ostrzeżenia?',
        descriptionHtml:
          '<p>Osobny post, czasem poparte stosownym PW w stosunku do zainteresowanego.</p><p>Trzecie zignorowanie – banicja na zawsze, czyli ban na IP.</p>',
        sortOrder: 9,
      },
    ])
    .run();
  db.insert(schema.translations)
    .values({ entity: 'faq_items', entityId: retired.id, field: 'title', locale: 'en', value: 'Private messages' })
    .run();
};

const pageAt = (path: string) => useDb().select().from(schema.pages).where(eq(schema.pages.path, path)).get();

const childPathsOf = (path: string) =>
  useDb()
    .select({ path: schema.pages.path })
    .from(schema.pages)
    .where(eq(schema.pages.parentId, pageAt(path)!.id))
    .orderBy(schema.pages.sortOrder)
    .all()
    .map((child) => child.path);

describe('content corrections', () => {
  beforeEach(() => {
    resetDatabase();
    seedLegacyContent();
  });

  it('gives pages proper titles and leaves the rest alone', () => {
    const report = applyContentCorrections(useDb());

    expect(pageAt(GREEK)?.title).toBe('Mitologia grecka');
    expect(pageAt(`${ZEW_KRWI}/3`)?.title).toBe('Zew krwi 3');
    expect(pageAt(`${ROMAN_GODS}/mars`)?.title).toBe('Mars');
    expect(pageAt('regulamin')?.title).toBe('Regulamin');
    expect(report.unknownPagePaths).toHaveLength(Object.keys(PAGE_TITLE_CORRECTIONS).length - report.pageTitles);
    expect(report.unknownPagePaths).not.toContain(GREEK);
  });

  it('puts a sequel next to the part it follows instead of under it', () => {
    applyContentCorrections(useDb());

    expect(childPathsOf(ZEW_KRWI)).toEqual([`${ZEW_KRWI}/1`, `${ZEW_KRWI}/2`, `${ZEW_KRWI}/3`, `${ZEW_KRWI}/4`]);
    expect(pageAt(`${ZEW_KRWI}/3`)).toMatchObject({ slug: '3', parentId: pageAt(ZEW_KRWI)!.id });
  });

  it('moves a page out of a hub made by a typo and removes the hub', () => {
    const report = applyContentCorrections(useDb());

    expect(childPathsOf(ROMAN_GODS)).toEqual([
      `${ROMAN_GODS}/jowisz`,
      `${ROMAN_GODS}/boginie-rzymskie`,
      `${ROMAN_GODS}/pluton`,
      `${ROMAN_GODS}/prozerpina`,
      `${ROMAN_GODS}/mars`,
    ]);
    expect(pageAt(MISPLACED_HUB)).toBeUndefined();
    expect(report).toMatchObject({ movedPages: 3, removedHubs: 1 });
  });

  it('points links and menu entries at the new addresses without touching similar ones', () => {
    applyContentCorrections(useDb());

    expect(pageAt('regulamin')?.bodyHtml).toBe(
      [
        `<p><a href="/${ROMAN_GODS}/pluton">Pluton</a> i <a href="/${ROMAN_GODS}/mars#opis">Mars</a>,`,
        `<a href="/${ROMAN_GODS}/jowisz">Jowisz</a>, <a href="/${ZEW_KRWI}/2">część druga</a>,`,
        `<a href="/${ZEW_KRWI}/3">część trzecia</a>, a w tekście /${ROMAN_GODS}/jowisz-2 bez odnośnika.</p>`,
      ].join(' '),
    );
    expect(
      useDb()
        .select({ url: schema.navigationLinks.url })
        .from(schema.navigationLinks)
        .orderBy(schema.navigationLinks.id)
        .all(),
    ).toEqual([{ url: `/${ROMAN_GODS}/mars` }, { url: `/${ROMAN_GODS}/jowisz` }]);
  });

  it('keeps a hub that still has pages', () => {
    addPage(`${MISPLACED_HUB}/inny-bog`);

    const report = applyContentCorrections(useDb());

    expect(pageAt(MISPLACED_HUB)).toBeDefined();
    expect(report.removedHubs).toBe(0);
  });

  it('turns a page that is only a banner into a draft and leaves pages with text published', () => {
    const report = applyContentCorrections(useDb());

    expect(pageAt(`${GREEK}/literatura`)?.status).toBe('draft');
    expect(pageAt(`${GREEK}/muzy`)?.status).toBe('published');
    expect(report.hiddenPages).toBe(1);
  });

  it('renames the misspelled news category together with its address', () => {
    applyContentCorrections(useDb());

    expect(useDb().select().from(schema.newsCategories).all()).toMatchObject([
      { slug: 'aktualizacje-strony', name: 'Aktualizacje strony' },
    ]);
  });

  it('rewrites the account questions, drops the ones about missing features and keeps other answers', () => {
    applyContentCorrections(useDb());

    const questions = useDb().select().from(schema.faqItems).all();
    const password = FAQ_ACCOUNT_QUESTIONS.find((question) => question.title === 'Zapomniałem hasła.')!;
    expect(useDb().select().from(schema.faqCategories).get()?.name).toBe(FAQ_ACCOUNT_CATEGORY.name);
    expect(questions.map((question) => question.title).sort()).toEqual([
      'Czym są ostrzeżenia?',
      'Kto zarządza stroną?',
      'Zapomniałem hasła.',
    ]);
    expect(questions.find((question) => question.title === password.title)).toMatchObject({
      descriptionHtml: password.descriptionHtml,
      sortOrder: FAQ_ACCOUNT_QUESTIONS.indexOf(password) * 10,
    });
    expect(questions.find((question) => question.title === 'Kto zarządza stroną?')).toMatchObject({
      descriptionHtml: '<p>Redakcja.</p>',
      sortOrder: 7,
    });
    expect(useDb().select().from(schema.translations).all()).toEqual([]);
  });

  it('replaces only the outdated detail of an answer', () => {
    const report = applyContentCorrections(useDb());

    const warnings = useDb()
      .select()
      .from(schema.faqItems)
      .where(eq(schema.faqItems.title, 'Czym są ostrzeżenia?'))
      .get();
    expect(warnings?.descriptionHtml).toBe(
      '<p>Osobny post.</p><p>Trzecie zignorowanie – banicja na zawsze, czyli trwała blokada konta.</p>',
    );
    expect(report.faqAnswerFixes).toBe(1);
  });

  it('changes nothing when applied again', () => {
    applyContentCorrections(useDb());
    const snapshot = () => ({
      pages: useDb().select().from(schema.pages).all(),
      links: useDb().select().from(schema.navigationLinks).all(),
      categories: useDb().select().from(schema.newsCategories).all(),
      questions: useDb().select().from(schema.faqItems).all(),
    });
    const afterFirstRun = snapshot();

    const report = applyContentCorrections(useDb());

    expect(snapshot()).toEqual(afterFirstRun);
    expect(report).toMatchObject({
      movedPages: 0,
      rewrittenLinks: 0,
      removedHubs: 0,
      hiddenPages: 0,
      faqAnswerFixes: 0,
      retiredFaqQuestions: 0,
    });
  });
});
