import { beforeEach, describe, expect, it } from 'vitest';
import { parseBundle } from '../../scripts/translations/bundle';
import { readContentFields, readStoredTranslations } from '../../scripts/translations/contentFields';
import { planBundles } from '../../scripts/translations/exportBundles';
import { storeTranslatedItems } from '../../scripts/translations/importBundles';
import { useDb } from '../../server/utils/db';
import { findPublishedPage } from '../../server/utils/pages';
import { createAccount, createNews, createPage, createPoll, resetDatabase } from './fixtures';

const GOLD_SAINTS_BODY =
  '<p>Dwunastu <strong>Złotych Rycerzy</strong> strzeże <a href="/sanktuarium">Sanktuarium</a>.</p>';
const LONG_POLISH_TEXT = 'Rycerze Ateny strzegą Sanktuarium od czasów mitologicznych. '.repeat(8);

const pendingBundles = (maxChars = 30_000) =>
  planBundles(readContentFields(useDb()), readStoredTranslations(useDb()), maxChars);

const sectionsOf = (kind: string) =>
  pendingBundles()
    .filter((bundle) => bundle.name.startsWith(kind))
    .flatMap((bundle) => parseBundle(bundle.content).items);

describe('translation bundles', () => {
  beforeEach(() => {
    resetDatabase();
  });

  it('exports every text worth translating once, with what it belongs to', () => {
    const page = createPage({ path: 'saint-seiya/zloci-rycerze', title: 'Złoci Rycerze', bodyHtml: GOLD_SAINTS_BODY });
    createPage({
      path: 'lost-canvas/zloci-rycerze',
      title: 'Złoci Rycerze',
      bodyHtml: '<p><img src="/media/a.png" /></p>',
    });
    createPage({ path: 'fan-fiction/zew-krwi/2', title: '2', bodyHtml: '' });
    const { poll } = createPoll();

    const bundles = pendingBundles();
    const texts = sectionsOf('text');
    expect(texts.filter((section) => section.text === 'Złoci Rycerze')).toHaveLength(1);
    expect(texts.some((section) => section.key === `polls:${poll.id}:question`)).toBe(true);
    expect(sectionsOf('html')).toEqual([{ key: `pages:${page.id}:body_html`, text: GOLD_SAINTS_BODY }]);
    expect(bundles.find((bundle) => bundle.name.startsWith('html'))?.content).toContain(
      '## "Złoci Rycerze", path: saint-seiya/zloci-rycerze',
    );
    expect(bundles.every((bundle) => parseBundle(bundle.content).isComplete)).toBe(true);
  });

  it('starts another file when the texts outgrow one', () => {
    createPage({ path: 'pierwsza', bodyHtml: `<p>${LONG_POLISH_TEXT}</p>` });
    createPage({ path: 'druga', bodyHtml: `<p>${LONG_POLISH_TEXT}</p>` });

    expect(pendingBundles(500).filter((bundle) => bundle.name.startsWith('html'))).toHaveLength(2);
  });

  it('stores a translation for every field with the same Polish text and shows it on the English page', () => {
    const first = createPage({ path: 'saint-seiya/zloci-rycerze', title: 'Złoci Rycerze', bodyHtml: GOLD_SAINTS_BODY });
    const second = createPage({ path: 'lost-canvas/zloci-rycerze', title: 'Złoci Rycerze' });

    const report = storeTranslatedItems(useDb(), [
      { key: `pages:${first.id}:title`, text: ' Gold Saints ' },
      {
        key: `pages:${first.id}:body_html`,
        text: '<p>The twelve <strong>Gold Saints</strong> guard the\n<a href="/sanktuarium">Sanctuary</a>.</p>',
      },
    ]);

    expect(report).toMatchObject({ stored: 3, rejected: [], unknownKeys: [] });
    expect(findPublishedPage(second.path, 'en')?.title).toBe('Gold Saints');
    expect(findPublishedPage(first.path, 'en')).toMatchObject({
      title: 'Gold Saints',
      bodyHtml: '<p>The twelve <strong>Gold Saints</strong> guard the\n<a href="/sanktuarium">Sanctuary</a>.</p>',
    });
    expect(findPublishedPage(first.path)?.title).toBe('Złoci Rycerze');
  });

  it('hands the established titles to the translator of the remaining texts', () => {
    const titled = createPage({ path: 'saint-seiya/zloci-rycerze', title: 'Złoci Rycerze', bodyHtml: '' });
    createPage({
      path: 'saint-seiya',
      title: 'Saint Seiya',
      bodyHtml: '<p><a href="/a">Złoci Rycerze</a> i inni.</p>',
    });
    storeTranslatedItems(useDb(), [{ key: `pages:${titled.id}:title`, text: 'Gold Saints' }]);

    const [bundle] = pendingBundles().filter((candidate) => candidate.name.startsWith('html'));
    expect(bundle?.content).toContain('- Złoci Rycerze = Gold Saints');
    expect(sectionsOf('text').map((section) => section.text)).toEqual(['Saint Seiya']);
  });

  it('rejects markup that changed, text that was cut short and unknown keys', () => {
    const author = createAccount();
    const page = createPage({ path: 'sanktuarium', bodyHtml: GOLD_SAINTS_BODY });
    const news = createNews(author.id, { bodyHtml: `<p>${LONG_POLISH_TEXT}</p>` });

    const report = storeTranslatedItems(useDb(), [
      {
        key: `pages:${page.id}:body_html`,
        text: '<p>The twelve Gold Saints guard the <a href="/sanctuary">Sanctuary</a>.</p>',
      },
      { key: `news:${news.id}:body_html`, text: '<p>Athena’s Saints have guarded the Sanctuary.</p>' },
      { key: `news:${news.id}:title`, text: '   ' },
      { key: 'pages:999999:title', text: 'Nothing' },
    ]);

    expect(report.stored).toBe(0);
    expect(report.unknownKeys).toEqual(['pages:999999:title']);
    expect(report.rejected).toEqual([
      {
        key: `pages:${page.id}:body_html`,
        reason: 'tags differ: missing <strong> <a href="/sanktuarium">; unexpected <a href="/sanctuary">',
      },
      { key: `news:${news.id}:body_html`, reason: 'text is 0.09 of the original length' },
      { key: `news:${news.id}:title`, reason: 'empty' },
    ]);
    expect(readStoredTranslations(useDb()).size).toBe(0);
  });

  it('cleans the markup it stores and flags a text left in Polish', () => {
    const page = createPage({ path: 'sanktuarium', bodyHtml: `<p>${LONG_POLISH_TEXT}</p>` });

    const report = storeTranslatedItems(useDb(), [
      {
        key: `pages:${page.id}:body_html`,
        text: `<p onclick="x()">${LONG_POLISH_TEXT.replace('Rycerze', 'Żołnierze')}</p>`,
      },
    ]);

    expect(report.warnings).toEqual([{ key: `pages:${page.id}:body_html`, note: 'still reads like Polish' }]);
    expect(readStoredTranslations(useDb()).get(`pages:${page.id}:body_html`)).not.toContain('onclick');
  });

  it('keeps the sections of the page tree in separate files', () => {
    createPage({ path: 'fan-fiction/aylis/wojna-zywiolow-1' });
    createPage({ path: 'fan-fiction/aylis/wojna-zywiolow-2' });
    createPage({ path: 'fan-fiction/lamia/zew-krwi/1' });

    const htmlBundles = pendingBundles().filter((bundle) => bundle.name.startsWith('html'));
    expect(htmlBundles.map((bundle) => bundle.keys.length)).toEqual([2, 1]);
  });

  it('gives spacer paragraphs their non-breaking spaces back', () => {
    const page = createPage({ path: 'sanktuarium', bodyHtml: '<p>Pierwszy</p><p>\u00a0</p><p>Drugi</p>' });
    const key = `pages:${page.id}:body_html`;

    storeTranslatedItems(useDb(), [{ key, text: '<p>First</p><p> </p><p>Second</p>' }]);

    expect(readStoredTranslations(useDb()).get(key)).toBe('<p>First</p><p>\u00a0</p><p>Second</p>');
  });

  it('keeps an existing translation unless told to overwrite it', () => {
    const page = createPage({ path: 'regulamin', title: 'Regulamin' });
    const key = `pages:${page.id}:title`;
    storeTranslatedItems(useDb(), [{ key, text: 'Rules' }]);

    expect(storeTranslatedItems(useDb(), [{ key, text: 'Terms' }])).toMatchObject({ stored: 0, alreadyTranslated: 1 });
    expect(readStoredTranslations(useDb()).get(key)).toBe('Rules');
    expect(storeTranslatedItems(useDb(), [{ key, text: 'Terms' }], { overwrite: true }).stored).toBe(1);
    expect(readStoredTranslations(useDb()).get(key)).toBe('Terms');
  });
});
