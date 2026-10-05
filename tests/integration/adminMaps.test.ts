import { existsSync, mkdirSync, utimesSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { mapsResource } from '../../server/admin/maps';
import { isMediaImageUsed } from '../../server/utils/mediaUsage';
import { findPublishedMap, listPublishedMaps } from '../../server/utils/maps';
import { readSetting, writeSetting } from '../../server/utils/settings';
import { testRuntimeConfig } from '../setup';
import { createAccount, createNews, createPage, resetDatabase } from './fixtures';

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

const uploadedFile = (storedPath: string) => join(testRuntimeConfig.uploadsDir, storedPath);

const LONG_AGO = new Date(2020, 0, 1);

const storeUpload = (storedPath: string, uploadedAt = new Date()) => {
  mkdirSync(dirname(uploadedFile(storedPath)), { recursive: true });
  writeFileSync(uploadedFile(storedPath), 'image');
  utimesSync(uploadedFile(storedPath), uploadedAt, uploadedAt);
};

describe('map images on disk', () => {
  beforeEach(resetDatabase);

  it('removes a replaced image and the images of a deleted map, keeping what other maps use', () => {
    const editor = createAccount({ role: 'admin' });
    ['maps/2020/old.webp', 'maps/2020/teaser.png', 'maps/2020/other.webp', 'thumbnails/maps/2020/old.webp'].forEach(
      (image) => storeUpload(image),
    );
    storeUpload('maps/2020/new.webp');
    storeUpload('maps/2020/abandoned.webp', LONG_AGO);
    mapsResource.create(mapInput({ title: 'Mapa nieba', image: 'maps/2020/other.webp' }), editor);
    const { id } = mapsResource.create(
      mapInput({ image: 'maps/2020/old.webp', teaserImage: 'maps/2020/teaser.png' }),
      editor,
    );

    mapsResource.update(id, mapInput({ image: 'maps/2020/new.webp', teaserImage: 'maps/2020/teaser.png' }), editor);

    expect(existsSync(uploadedFile('maps/2020/old.webp'))).toBe(false);
    expect(existsSync(uploadedFile('thumbnails/maps/2020/old.webp'))).toBe(false);
    expect(existsSync(uploadedFile('maps/2020/new.webp'))).toBe(true);
    expect(existsSync(uploadedFile('maps/2020/abandoned.webp'))).toBe(false);

    mapsResource.remove(id, editor);

    expect(existsSync(uploadedFile('maps/2020/new.webp'))).toBe(false);
    expect(existsSync(uploadedFile('maps/2020/teaser.png'))).toBe(false);
    expect(existsSync(uploadedFile('maps/2020/other.webp'))).toBe(true);
  });

  it('keeps an English map image and a fresh upload that no map has saved yet', () => {
    const editor = createAccount({ role: 'admin' });
    storeUpload('maps/2020/pl.webp', LONG_AGO);
    storeUpload('maps/2020/unsaved.webp');
    const { id } = mapsResource.create(mapInput({ image: 'maps/2020/pl.webp' }), editor);
    storeUpload('maps/2020/en.webp');

    mapsResource.update(id, mapInput({ image: 'maps/2020/en.webp' }), editor, 'en');

    expect(existsSync(uploadedFile('maps/2020/pl.webp'))).toBe(true);
    expect(existsSync(uploadedFile('maps/2020/en.webp'))).toBe(true);
    expect(existsSync(uploadedFile('maps/2020/unsaved.webp'))).toBe(true);
  });
});

describe('image library usage', () => {
  beforeEach(resetDatabase);

  it('recognises an image used as a map teaser or inside content', () => {
    const editor = createAccount({ role: 'admin' });
    mapsResource.create(mapInput({ teaserImage: 'images/2026/teaser.png' }), editor);
    createNews(editor.id, { bodyHtml: '<p><img src="/media/images/2026/in-news.jpg" alt="" /></p>' });

    expect(isMediaImageUsed('images/2026/teaser.png')).toBe(true);
    expect(isMediaImageUsed('images/2026/in-news.jpg')).toBe(true);
    expect(isMediaImageUsed('images/2026/unused.jpg')).toBe(false);
  });
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

    expect(createWith({ targetKind: 'page', pageId: null })).toThrowError('VALIDATION.MAP_AREA_PAGE_REQUIRED');
    expect(createWith({ targetKind: 'url', url: 'javascript:alert(1)' })).toThrowError(
      'VALIDATION.MAP_AREA_URL_REQUIRED',
    );
    expect(createWith({ targetKind: 'url', url: '//evil.example' })).toThrowError('VALIDATION.MAP_AREA_URL_REQUIRED');
    expect(createWith({ targetKind: 'content', contentHtml: '  ' })).toThrowError(
      'VALIDATION.MAP_AREA_CONTENT_REQUIRED',
    );
    expect(() => mapsResource.create(mapInput({ image: '' }), editor)).toThrowError('VALIDATION.MAP_IMAGE_REQUIRED');
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
