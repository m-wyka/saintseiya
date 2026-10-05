import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { listAlbumPhotos, updatePhoto } from '../../server/admin/content/photos';
import { mapsResource } from '../../server/admin/maps';
import { newsResource } from '../../server/admin/news';
import { schema, useDb } from '../../server/utils/db';
import { readSetting, writeSetting } from '../../server/utils/settings';
import { createAccount, createAlbum, createPhoto, resetDatabase } from './fixtures';

const newsInput = {
  title: 'Nowy rozdział mangi',
  slug: '',
  categoryId: null,
  tagIds: [],
  excerptHtml: '<p>Zajawka</p>',
  bodyHtml: '<p>Treść</p>',
  status: 'published',
  commentsEnabled: true,
  publishedAt: null,
};

const frame = { leftPercent: 10, topPercent: 20, widthPercent: 30, heightPercent: 15 };

const mapInput = {
  title: 'Mapa nieba',
  slug: '',
  description: 'Gwiazdozbiory',
  image: 'maps/niebo-pl.webp',
  imageWidth: 1280,
  imageHeight: 720,
  teaserImage: null,
  status: 'published',
  sortOrder: 0,
  areas: [{ ...frame, label: 'Pegaz', targetKind: 'content', contentHtml: '<p>Opis Pegaza</p>' }],
};

type StoredRecord = Record<string, unknown> & { areas: (Record<string, unknown> & { id: number })[] };

const storedTranslations = () => useDb().select().from(schema.translations).all();
const storedNews = (id: number) => useDb().select().from(schema.news).where(eq(schema.news.id, id)).get()!;

describe('translating content in the panel', () => {
  beforeEach(resetDatabase);

  it('stores only the changed texts as a translation and leaves the Polish version alone', () => {
    const editor = createAccount({ role: 'admin' });
    const { id } = newsResource.create(newsInput, editor);
    const polish = newsResource.find(id) as Record<string, unknown>;

    newsResource.update(id, { ...polish, title: 'New manga chapter', status: 'draft' }, editor, 'en');

    expect(storedNews(id)).toMatchObject({ title: 'Nowy rozdział mangi', bodyHtml: '<p>Treść</p>', status: 'draft' });
    expect(storedTranslations()).toEqual([
      { entity: 'news', entityId: id, field: 'title', locale: 'en', value: 'New manga chapter' },
    ]);
    expect(newsResource.find(id, 'en')).toMatchObject({ title: 'New manga chapter', bodyHtml: '<p>Treść</p>' });
    expect(newsResource.find(id)).toMatchObject({ title: 'Nowy rozdział mangi' });
  });

  it('cleans translated HTML and drops a translation that is emptied or equal to the Polish text', () => {
    const editor = createAccount({ role: 'admin' });
    const { id } = newsResource.create(newsInput, editor);
    const polish = newsResource.find(id) as Record<string, unknown>;

    newsResource.update(id, { ...polish, bodyHtml: '<p onclick="x()">Body</p><script>x</script>' }, editor, 'en');
    expect(newsResource.find(id, 'en')).toMatchObject({ bodyHtml: '<p>Body</p>' });

    newsResource.update(id, { ...polish, bodyHtml: '' }, editor, 'en');
    expect(storedTranslations()).toEqual([]);
  });

  it('translates map texts, its image and its areas, keeping area translations across edits', () => {
    const editor = createAccount({ role: 'admin' });
    const { id } = mapsResource.create(mapInput, editor);
    const polish = mapsResource.find(id) as StoredRecord;

    mapsResource.update(
      id,
      {
        ...polish,
        title: 'Sky map',
        image: 'maps/sky-en.webp',
        areas: [{ ...polish.areas[0], label: 'Pegasus', contentHtml: '<p>About Pegasus</p>' }],
      },
      editor,
      'en',
    );
    const polishAfterTranslation = mapsResource.find(id) as StoredRecord;
    mapsResource.update(
      id,
      {
        ...polishAfterTranslation,
        areas: [...polishAfterTranslation.areas, { ...frame, label: 'Smok', targetKind: 'url', url: '/smok' }],
      },
      editor,
    );

    expect(mapsResource.find(id)).toMatchObject({
      title: 'Mapa nieba',
      image: 'maps/niebo-pl.webp',
      areas: [{ label: 'Pegaz', contentHtml: '<p>Opis Pegaza</p>' }, { label: 'Smok' }],
    });
    expect(mapsResource.find(id, 'en')).toMatchObject({
      title: 'Sky map',
      description: 'Gwiazdozbiory',
      image: 'maps/sky-en.webp',
      areas: [{ label: 'Pegasus', contentHtml: '<p>About Pegasus</p>' }, { label: 'Smok' }],
    });
  });

  it('removes translations together with the record and its dropped areas', () => {
    const editor = createAccount({ role: 'admin' });
    const { id } = mapsResource.create(mapInput, editor);
    const polish = mapsResource.find(id) as StoredRecord;
    mapsResource.update(
      id,
      { ...polish, title: 'Sky map', areas: [{ ...polish.areas[0], label: 'Pegasus' }] },
      editor,
      'en',
    );

    mapsResource.update(id, { ...polish, areas: [] }, editor);
    expect(storedTranslations().map((row) => row.entity)).toEqual(['maps']);

    mapsResource.remove(id, editor);
    expect(storedTranslations()).toEqual([]);
  });

  it('translates photo captions without touching the Polish ones', () => {
    const album = createAlbum();
    const photo = createPhoto(album.id, { title: 'Okładka', description: 'Tom pierwszy' });

    updatePhoto(photo.id, { title: 'Cover', description: 'Tom pierwszy' }, 'en');

    expect(listAlbumPhotos(album.id).photos[0]).toMatchObject({ title: 'Okładka', description: 'Tom pierwszy' });
    expect(listAlbumPhotos(album.id, 'en').photos[0]).toMatchObject({ title: 'Cover', description: 'Tom pierwszy' });
  });

  it('keeps a separate News Center per language and falls back to the Polish one', () => {
    const polishTabs = [{ title: 'Manga', bodyHtml: '<p>Nowości</p>' }];
    writeSetting('newsCenterTabs', polishTabs);

    expect(readSetting('newsCenterTabs', 'en')).toEqual(polishTabs);

    writeSetting('newsCenterTabs', [{ title: 'Manga', bodyHtml: '<p>News</p>' }], 'en');
    expect(readSetting('newsCenterTabs', 'en')).toEqual([{ title: 'Manga', bodyHtml: '<p>News</p>' }]);
    expect(readSetting('newsCenterTabs')).toEqual(polishTabs);
  });
});
