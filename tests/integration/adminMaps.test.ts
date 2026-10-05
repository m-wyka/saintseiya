import { beforeEach, describe, expect, it } from 'vitest';
import { mapsResource } from '../../server/admin/maps';
import { findPublishedMap, listPublishedMaps } from '../../server/utils/maps';
import { readSetting, writeSetting } from '../../server/utils/settings';
import { createAccount, createPage, resetDatabase } from './fixtures';

const frame = { leftPercent: 10, topPercent: 20, widthPercent: 30, heightPercent: 15 };

const mapInput = (overrides: Record<string, unknown> = {}) => ({
  title: 'Królestwo Posejdona',
  slug: '',
  description: 'Siedem filarów',
  image: 'maps/posejdon.webp',
  imageWidth: 1280,
  imageHeight: 1412,
  teaserImage: null,
  status: 'published',
  sortOrder: 0,
  areas: [],
  ...overrides,
});

describe('map administration', () => {
  beforeEach(resetDatabase);

  it('stores a map with its areas and serves it publicly with resolved targets', () => {
    const editor = createAccount({ role: 'admin' });
    const page = createPage({ path: 'mitologia/grecka/posejdon', title: 'Posejdon' });
    const draft = createPage({ path: 'szkic', status: 'draft' });

    mapsResource.create(
      mapInput({
        areas: [
          { ...frame, label: 'Posejdon', targetKind: 'page', pageId: page.id },
          { ...frame, label: 'Szkic', targetKind: 'page', pageId: draft.id },
          { ...frame, label: 'Forum', targetKind: 'url', url: '/forum' },
          { ...frame, label: 'Opis', targetKind: 'content', contentHtml: '<p onclick="x()">Filar</p>' },
        ],
      }),
      editor,
    );

    const map = findPublishedMap('krolestwo-posejdona')!;
    expect(map).toMatchObject({ title: 'Królestwo Posejdona', imageWidth: 1280 });
    expect(map.areas.map((area) => [area.label, area.link, area.contentHtml])).toEqual([
      ['Posejdon', '/mitologia/grecka/posejdon', null],
      ['Forum', '/forum', null],
      ['Opis', null, '<p>Filar</p>'],
    ]);
    expect(listPublishedMaps().map((listed) => listed.slug)).toEqual(['krolestwo-posejdona']);
  });

  it('replaces the whole area set on update and hides drafts from visitors', () => {
    const editor = createAccount({ role: 'admin' });
    const { id } = mapsResource.create(
      mapInput({ areas: [{ ...frame, label: 'Stary', targetKind: 'url', url: '/forum' }] }),
      editor,
    );

    mapsResource.update(
      id,
      mapInput({
        status: 'draft',
        areas: [{ ...frame, label: 'Nowy', targetKind: 'url', url: 'https://example.com' }],
      }),
      editor,
    );

    expect(mapsResource.find(id)).toMatchObject({
      status: 'draft',
      areas: [{ label: 'Nowy', url: 'https://example.com' }],
    });
    expect(findPublishedMap('krolestwo-posejdona')).toBeNull();
  });

  it('rejects areas without a usable target', () => {
    const editor = createAccount({ role: 'admin' });
    const createWith = (area: Record<string, unknown>) => () =>
      mapsResource.create(mapInput({ areas: [{ ...frame, label: 'Filar', ...area }] }), editor);

    expect(createWith({ targetKind: 'page', pageId: null })).toThrowError(/wybierz podstronę/);
    expect(createWith({ targetKind: 'url', url: 'javascript:alert(1)' })).toThrowError(/podaj adres/);
    expect(createWith({ targetKind: 'url', url: '//evil.example' })).toThrowError(/podaj adres/);
    expect(createWith({ targetKind: 'content', contentHtml: '  ' })).toThrowError(/wpisz treść/);
    expect(() => mapsResource.create(mapInput({ image: '' }), editor)).toThrowError(/Wgraj obraz/);
  });

  it('keeps map addresses unique', () => {
    const editor = createAccount({ role: 'admin' });
    mapsResource.create(mapInput(), editor);
    const second = mapsResource.create(mapInput(), editor);

    expect(mapsResource.find(second.id)).toMatchObject({ slug: 'krolestwo-posejdona-2' });
  });
});

describe('settings', () => {
  beforeEach(resetDatabase);

  it('returns the default until a value is stored and then the stored value', () => {
    expect(readSetting('newsCenterTabs')).toEqual([]);

    writeSetting('newsCenterTabs', [{ title: 'Manga', bodyHtml: '<p>Tom 1</p>' }]);
    writeSetting('newsCenterTabs', [{ title: 'Anime', bodyHtml: '<p>Odcinek 1</p>' }]);

    expect(readSetting('newsCenterTabs')).toEqual([{ title: 'Anime', bodyHtml: '<p>Odcinek 1</p>' }]);
  });
});
