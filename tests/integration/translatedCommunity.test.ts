import { beforeEach, describe, expect, it } from 'vitest';
import { schema, useDb } from '../../server/utils/db';
import { linkDirectory, listDownloads } from '../../server/utils/directory';
import { findVisibleThread, forumIndex, forumThreads } from '../../server/utils/forum';
import { createThread } from '../../server/utils/forumWrites';
import { albumPhotos, findPhoto, listAlbums } from '../../server/utils/gallery';
import { listPolls } from '../../server/utils/polls';
import { listVideoCategories, listVideos } from '../../server/utils/videos';
import { createAccount, createAlbum, createForum, createPhoto, createPoll, resetDatabase } from './fixtures';

const translate = (entity: string, entityId: number, field: string, value: string) => {
  useDb().insert(schema.translations).values({ entity, entityId, field, locale: 'en', value }).run();
};

const resetWithTranslations = () => {
  useDb().delete(schema.translations).run();
  resetDatabase();
};

describe('translated community content', () => {
  beforeEach(resetWithTranslations);

  it('translates forum and category names and falls back to Polish', () => {
    const forum = createForum();
    const { threadId } = createThread(forum, createAccount(), 'Temat', '<p>A</p>');
    useDb().update(schema.forums).set({ description: 'Opis działu' }).run();
    translate('forums', forum.id, 'name', 'Sanctuary');
    translate('forum_categories', forum.categoryId, 'name', 'General');

    const [polishCategory] = forumIndex(null);
    expect(polishCategory!.name).toMatch(/^Kategoria/);
    expect(polishCategory!.forums[0]).toMatchObject({ name: forum.name, description: 'Opis działu' });

    const [englishCategory] = forumIndex(null, 'en');
    expect(englishCategory!.name).toBe('General');
    expect(englishCategory!.forums[0]).toMatchObject({
      slug: forum.slug,
      name: 'Sanctuary',
      description: 'Opis działu',
    });
    expect(englishCategory!.forums[0]!.latestThread?.title).toBe('Temat');
    expect(forumThreads(forum.slug, 1, null, 'en')?.forum).toMatchObject({
      name: 'Sanctuary',
      categoryName: 'General',
    });
    expect(forumThreads(forum.slug, 1, null)?.forum.name).toBe(forum.name);
    expect(findVisibleThread(threadId, null, 'en')).toMatchObject({ title: 'Temat', forum: { name: 'Sanctuary' } });
  });

  it('translates an album and its photos', () => {
    const album = createAlbum({ title: 'Zbroje', description: 'Opis albumu', coverImage: 'photos/okladka.jpg' });
    const photo = createPhoto(album.id, { title: 'Pegaz', description: 'Opis zdjęcia' });
    translate('albums', album.id, 'title', 'Cloths');
    translate('albums', album.id, 'cover_image', 'photos/cover-en.jpg');
    translate('photos', photo.id, 'title', 'Pegasus');

    expect(listAlbums()).toMatchObject([{ title: 'Zbroje', coverImage: 'photos/okladka.jpg', photoCount: 1 }]);
    expect(listAlbums('en')).toMatchObject([
      {
        slug: album.slug,
        title: 'Cloths',
        description: 'Opis albumu',
        coverImage: 'photos/cover-en.jpg',
        photoCount: 1,
      },
    ]);
    expect(albumPhotos(album.slug, 1)?.photos.items[0]!.title).toBe('Pegaz');
    const translated = albumPhotos(album.slug, 1, 'en')!;
    expect(translated.album).toMatchObject({ title: 'Cloths', description: 'Opis albumu' });
    expect(translated.photos.items[0]!.title).toBe('Pegasus');
    expect(findPhoto(photo.id)).toMatchObject({ title: 'Pegaz', album: { title: 'Zbroje' } });
    expect(findPhoto(photo.id, 'en')).toMatchObject({
      title: 'Pegasus',
      description: 'Opis zdjęcia',
      album: { slug: album.slug, title: 'Cloths' },
    });
  });

  it('translates video categories and videos', () => {
    const db = useDb();
    const category = db
      .insert(schema.videoCategories)
      .values({ slug: 'zwiastuny', name: 'Zwiastuny', description: 'Opis kategorii' })
      .returning()
      .get();
    const video = db
      .insert(schema.videos)
      .values({ categoryId: category.id, title: 'Zapowiedź', description: 'Opis filmu', youtubeId: 'abcdefghijk' })
      .returning()
      .get();
    translate('video_categories', category.id, 'name', 'Trailers');
    translate('videos', video.id, 'description', 'Video description');

    expect(listVideoCategories()).toMatchObject([{ name: 'Zwiastuny', videoCount: 1 }]);
    expect(listVideoCategories('en')).toMatchObject([
      { slug: 'zwiastuny', name: 'Trailers', description: 'Opis kategorii', videoCount: 1 },
    ]);
    expect(listVideos(1).items).toMatchObject([{ description: 'Opis filmu', categoryName: 'Zwiastuny' }]);
    expect(listVideos(1, 'zwiastuny', 'en').items).toMatchObject([
      { title: 'Zapowiedź', description: 'Video description', categoryName: 'Trailers' },
    ]);
  });

  it('translates links and downloads and sorts links by the translated title', () => {
    const db = useDb();
    const category = db.insert(schema.linkCategories).values({ name: 'Strony fanów' }).returning().get();
    const [first, second] = db
      .insert(schema.links)
      .values([
        { categoryId: category.id, title: 'Atena', description: 'Opis', url: 'https://example.com/a' },
        { categoryId: category.id, title: 'Zodiak', url: 'https://example.com/z' },
      ])
      .returning()
      .all();
    const download = db
      .insert(schema.downloads)
      .values({ title: 'Napisy', description: 'Opis pliku', file: 'downloads/napisy.zip', fileSize: 10 })
      .returning()
      .get();
    translate('link_categories', category.id, 'name', 'Fan sites');
    translate('links', first!.id, 'title', 'Zeus temple');
    translate('links', second!.id, 'title', 'Ancient zodiac');
    translate('downloads', download.id, 'title', 'Subtitles');

    expect(linkDirectory()).toMatchObject([{ name: 'Strony fanów', links: [{ title: 'Atena' }, { title: 'Zodiak' }] }]);
    expect(linkDirectory('en')).toMatchObject([
      { name: 'Fan sites', links: [{ title: 'Ancient zodiac' }, { title: 'Zeus temple', description: 'Opis' }] },
    ]);
    expect(listDownloads()).toMatchObject([{ title: 'Napisy' }]);
    expect(listDownloads('en')).toMatchObject([{ id: download.id, title: 'Subtitles', description: 'Opis pliku' }]);
  });

  it('translates a poll with its options', () => {
    const { poll, options } = createPoll();
    translate('polls', poll.id, 'question', 'Favourite saint?');
    translate('poll_options', options[0]!.id, 'label', 'Pegasus Seiya');

    expect(listPolls(1, null).items[0]).toMatchObject({
      question: 'Ulubiony rycerz?',
      options: [{ label: 'Seiya' }, {}],
    });
    expect(listPolls(1, null, 'en').items[0]).toMatchObject({
      question: 'Favourite saint?',
      isOpen: true,
      options: [
        { label: 'Pegasus Seiya', voteCount: 5 },
        { label: 'Shiryu', voteCount: 0 },
      ],
    });
  });
});
