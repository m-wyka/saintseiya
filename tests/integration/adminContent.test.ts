import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { asc, eq } from 'drizzle-orm';
import type { H3Event, MultiPartData } from 'h3';
import sharp from 'sharp';
import { beforeEach, describe, expect, it } from 'vitest';
import { albumsResource } from '../../server/admin/content/albums';
import { movedOrder } from '../../server/admin/content/ordering';
import { findParentCandidates, listPageLevel, movePage, pagesResource } from '../../server/admin/content/pages';
import { descendantPaths, isInsideSubtree, pagePath, pathPrefixes } from '../../server/admin/content/pageTree';
import {
  listAlbumPhotos,
  movePhoto,
  removePhoto,
  setAlbumCover,
  updatePhoto,
  uploadPhotos,
} from '../../server/admin/content/photos';
import { tagsResource } from '../../server/admin/tags';
import { createComment } from '../../server/utils/communityWrites';
import { schema, useDb } from '../../server/utils/db';
import { albumPhotos, listAlbums } from '../../server/utils/gallery';
import { findPublishedPage } from '../../server/utils/pages';
import { createAccount, createAlbum, createNews, createPhoto, resetDatabase } from './fixtures';

const event = {} as H3Event;

const pageInput = {
  title: 'Mitologia',
  slug: '',
  parentId: null as number | null,
  kind: 'article',
  bodyHtml: '<p>Treść</p>',
  status: 'published',
  commentsEnabled: true,
  tagIds: [] as number[],
};

const storedPage = (id: number) => useDb().select().from(schema.pages).where(eq(schema.pages.id, id)).get()!;

const pathOf = (id: number) => storedPage(id).path;

const childOrder = (parentId: number) =>
  useDb()
    .select({ title: schema.pages.title, sortOrder: schema.pages.sortOrder })
    .from(schema.pages)
    .where(eq(schema.pages.parentId, parentId))
    .orderBy(asc(schema.pages.sortOrder), asc(schema.pages.id))
    .all();

const addPage = (title: string, parentId: number | null = null, overrides: Partial<typeof pageInput> = {}) =>
  pagesResource.create({ ...pageInput, title, parentId, ...overrides }, createAccount({ role: 'admin' })).id;

const editPage = (id: number, changes: Partial<typeof pageInput>) => {
  const { title, slug, parentId, kind, bodyHtml, status, commentsEnabled } = storedPage(id);
  pagesResource.update(
    id,
    { title, slug, parentId, kind, bodyHtml, status, commentsEnabled, tagIds: [], ...changes },
    createAccount({ role: 'admin' }),
  );
};

describe('page tree rules', () => {
  const nodes = [
    { id: 1, parentId: null, slug: 'mitologia' },
    { id: 2, parentId: 1, slug: 'grecka' },
    { id: 3, parentId: 2, slug: 'bogowie' },
    { id: 4, parentId: 3, slug: 'zeus' },
    { id: 5, parentId: null, slug: 'ataki' },
  ];

  it('builds a full address from the parent address and the slug', () => {
    expect(pagePath(null, 'mitologia')).toBe('mitologia');
    expect(pagePath('mitologia/grecka', 'bogowie')).toBe('mitologia/grecka/bogowie');
    expect(pathPrefixes('mitologia/grecka/bogowie')).toEqual([
      'mitologia',
      'mitologia/grecka',
      'mitologia/grecka/bogowie',
    ]);
  });

  it('recognises a page itself and every descendant as part of its subtree', () => {
    expect(isInsideSubtree(nodes, 2, 2)).toBe(true);
    expect(isInsideSubtree(nodes, 2, 4)).toBe(true);
    expect(isInsideSubtree(nodes, 2, 1)).toBe(false);
    expect(isInsideSubtree(nodes, 2, 5)).toBe(false);
    expect(isInsideSubtree(nodes, 2, null)).toBe(false);
  });

  it('recomputes the address of every descendant below a moved page', () => {
    expect(descendantPaths(nodes, 2, 'ataki/greckie')).toEqual([
      { id: 3, path: 'ataki/greckie/bogowie' },
      { id: 4, path: 'ataki/greckie/bogowie/zeus' },
    ]);
    expect(descendantPaths(nodes, 4, 'zeus')).toEqual([]);
  });

  it('swaps an item with its neighbour and leaves the edges alone', () => {
    expect(movedOrder([1, 2, 3], 2, 'previous')).toEqual([2, 1, 3]);
    expect(movedOrder([1, 2, 3], 2, 'next')).toEqual([1, 3, 2]);
    expect(movedOrder([1, 2, 3], 1, 'previous')).toEqual([1, 2, 3]);
    expect(movedOrder([1, 2, 3], 3, 'next')).toEqual([1, 2, 3]);
    expect(movedOrder([1, 2, 3], 9, 'next')).toEqual([1, 2, 3]);
  });
});

describe('page administration', () => {
  beforeEach(resetDatabase);

  it('builds the address from the parent address and a slug generated from the title', () => {
    const root = addPage('Mitologia');
    const greek = addPage('Grecka', root);
    const zeus = addPage('Zeus Gromowładny', greek, { slug: 'zeus' });

    expect(storedPage(root)).toMatchObject({ slug: 'mitologia', path: 'mitologia', parentId: null });
    expect(storedPage(greek)).toMatchObject({ slug: 'grecka', path: 'mitologia/grecka', parentId: root });
    expect(pathOf(zeus)).toBe('mitologia/grecka/zeus');
    expect(findPublishedPage('mitologia/grecka/zeus')).toMatchObject({ id: zeus, title: 'Zeus Gromowładny' });
  });

  it('keeps slugs unique among siblings only', () => {
    const greek = addPage('Grecka');
    const roman = addPage('Rzymska');

    const first = addPage('Bogowie', greek);
    const second = addPage('Bogowie', greek);
    const third = addPage('Bogowie', greek);
    const elsewhere = addPage('Bogowie', roman);

    expect([first, second, third, elsewhere].map(pathOf)).toEqual([
      'grecka/bogowie',
      'grecka/bogowie-2',
      'grecka/bogowie-3',
      'rzymska/bogowie',
    ]);
  });

  it('never gives a root page an address reserved for another part of the portal', () => {
    const rootGallery = addPage('Galeria');
    const rootForum = addPage('Dowolny tytuł', null, { slug: 'forum' });
    const nestedGallery = addPage('Galeria', rootGallery);

    expect(pathOf(rootGallery)).toBe('galeria-2');
    expect(pathOf(rootForum)).toBe('forum-2');
    expect(pathOf(nestedGallery)).toBe('galeria-2/galeria');

    editPage(nestedGallery, { parentId: null });

    expect(pathOf(nestedGallery)).toBe('galeria-3');
  });

  it('stores cleaned content and rejects invalid input', () => {
    const page = addPage('Ataki', null, {
      bodyHtml: '<p onclick="x()">Pegasus <strong>Ryūsei Ken</strong><script>alert(1)</script></p>',
    });

    expect(storedPage(page).bodyHtml).toBe('<p>Pegasus <strong>Ryūsei Ken</strong></p>');

    editPage(page, { bodyHtml: '<p>Nowa<iframe src="https://evil.example/x"></iframe></p>' });

    expect(storedPage(page).bodyHtml).toBe('<p>Nowa</p>');
    expect(() => addPage('   ')).toThrowError('VALIDATION.PAGE_TITLE_REQUIRED');
    expect(() => addPage('Ataki', null, { slug: 'Zły Adres' })).toThrowError('VALIDATION.SLUG_INVALID');
    expect(() => addPage('Ataki', 999_999)).toThrowError('ERRORS.PARENT_PAGE_NOT_FOUND');
  });

  it('recomputes the address of a page and all its descendants when the slug changes', () => {
    const root = addPage('Mitologia');
    const greek = addPage('Grecka', root);
    const gods = addPage('Bogowie', greek);
    const zeus = addPage('Zeus', gods);
    const roman = addPage('Rzymska', root);

    editPage(greek, { slug: 'hellada' });

    expect([greek, gods, zeus].map(pathOf)).toEqual([
      'mitologia/hellada',
      'mitologia/hellada/bogowie',
      'mitologia/hellada/bogowie/zeus',
    ]);
    expect([root, roman].map(pathOf)).toEqual(['mitologia', 'mitologia/rzymska']);
    expect(findPublishedPage('mitologia/hellada/bogowie/zeus')?.id).toBe(zeus);
    expect(findPublishedPage('mitologia/grecka/bogowie/zeus')).toBeNull();
  });

  it('recomputes the address of a page and all its descendants when the parent changes', () => {
    const mythology = addPage('Mitologia');
    const greek = addPage('Grecka', mythology);
    const gods = addPage('Bogowie', greek);
    const zeus = addPage('Zeus', gods);
    const archive = addPage('Archiwum');

    editPage(greek, { parentId: archive });

    expect([greek, gods, zeus].map(pathOf)).toEqual([
      'archiwum/grecka',
      'archiwum/grecka/bogowie',
      'archiwum/grecka/bogowie/zeus',
    ]);
    expect(storedPage(greek).parentId).toBe(archive);

    editPage(greek, { parentId: null });

    expect([greek, gods, zeus].map(pathOf)).toEqual(['grecka', 'grecka/bogowie', 'grecka/bogowie/zeus']);
    expect(findPublishedPage('grecka/bogowie')?.breadcrumbs).toEqual([{ title: 'Grecka', path: 'grecka' }]);
  });

  it('keeps the address unique among the new siblings when a page is moved', () => {
    const greek = addPage('Grecka');
    const roman = addPage('Rzymska');
    addPage('Bogowie', roman);
    const moved = addPage('Bogowie', greek);
    const child = addPage('Zeus', moved);

    editPage(moved, { parentId: roman });

    expect(pathOf(moved)).toBe('rzymska/bogowie-2');
    expect(pathOf(child)).toBe('rzymska/bogowie-2/zeus');
  });

  it('refuses to make a page its own parent or a child of its descendant', () => {
    const root = addPage('Mitologia');
    const greek = addPage('Grecka', root);
    const gods = addPage('Bogowie', greek);

    expect(() => editPage(root, { parentId: root })).toThrowError('ERRORS.PAGE_PARENT_CYCLE');
    expect(() => editPage(root, { parentId: gods })).toThrowError('ERRORS.PAGE_PARENT_CYCLE');
    expect(() => editPage(greek, { parentId: gods, slug: 'inna' })).toThrowError('ERRORS.PAGE_PARENT_CYCLE');
    expect([root, greek, gods].map(pathOf)).toEqual(['mitologia', 'mitologia/grecka', 'mitologia/grecka/bogowie']);
    expect(storedPage(root).parentId).toBeNull();
  });

  it('changes the addresses in a single transaction, so a failed save changes nothing', () => {
    const root = addPage('Mitologia');
    const greek = addPage('Grecka', root);
    const gods = addPage('Bogowie', greek);
    const missingTagId = 999_999;

    expect(() => editPage(greek, { slug: 'hellada', title: 'Hellada', tagIds: [missingTagId] })).toThrowError();

    expect(storedPage(greek)).toMatchObject({ title: 'Grecka', slug: 'grecka', path: 'mitologia/grecka' });
    expect(pathOf(gods)).toBe('mitologia/grecka/bogowie');
  });

  it('appends new and moved pages at the end of the sibling order and closes the gap left behind', () => {
    const greek = addPage('Grecka');
    const roman = addPage('Rzymska');
    addPage('Zeus', greek);
    const hera = addPage('Hera', greek);
    addPage('Ares', greek);
    addPage('Jowisz', roman);

    editPage(hera, { parentId: roman });

    expect(childOrder(greek)).toEqual([
      { title: 'Zeus', sortOrder: 0 },
      { title: 'Ares', sortOrder: 1 },
    ]);
    expect(childOrder(roman)).toEqual([
      { title: 'Jowisz', sortOrder: 0 },
      { title: 'Hera', sortOrder: 1 },
    ]);
  });

  it('moves a page up and down by swapping it with its neighbour', () => {
    const root = addPage('Bogowie');
    const zeus = addPage('Zeus', root);
    const hera = addPage('Hera', root);
    const ares = addPage('Ares', root);

    movePage(ares, 'previous');

    expect(childOrder(root).map((page) => page.title)).toEqual(['Zeus', 'Ares', 'Hera']);

    movePage(zeus, 'next');
    movePage(zeus, 'next');
    movePage(zeus, 'next');
    movePage(ares, 'previous');

    expect(childOrder(root)).toEqual([
      { title: 'Ares', sortOrder: 0 },
      { title: 'Hera', sortOrder: 1 },
      { title: 'Zeus', sortOrder: 2 },
    ]);
    expect(findPublishedPage('bogowie')?.children.map((child) => child.title)).toEqual(['Ares', 'Hera', 'Zeus']);
    expect(storedPage(hera).sortOrder).toBe(1);
  });

  it('repairs duplicated and sparse sibling order while moving, without touching other levels', () => {
    const root = addPage('Bogowie');
    const other = addPage('Tytani');
    const zeus = addPage('Zeus', root);
    const hera = addPage('Hera', root);
    const ares = addPage('Ares', root);
    const hades = addPage('Hades', root);
    const kronos = addPage('Kronos', other);
    const setOrder = (id: number, sortOrder: number) =>
      useDb().update(schema.pages).set({ sortOrder }).where(eq(schema.pages.id, id)).run();
    setOrder(zeus, 5);
    setOrder(hera, 5);
    setOrder(ares, 40);
    setOrder(hades, 41);
    setOrder(kronos, 7);

    movePage(ares, 'previous');

    expect(childOrder(root)).toEqual([
      { title: 'Zeus', sortOrder: 0 },
      { title: 'Ares', sortOrder: 1 },
      { title: 'Hera', sortOrder: 2 },
      { title: 'Hades', sortOrder: 3 },
    ]);
    expect(storedPage(kronos).sortOrder).toBe(7);
  });

  it('refuses to delete a page that still has sub-pages', () => {
    const root = addPage('Mitologia');
    const greek = addPage('Grecka', root);
    const editor = createAccount({ role: 'admin' });

    expect(() => pagesResource.remove(root, editor)).toThrowError('ERRORS.PAGE_HAS_CHILDREN');
    expect(pagesResource.find(root)).toBeDefined();

    pagesResource.remove(greek, editor);
    pagesResource.remove(root, editor);

    expect(useDb().select().from(schema.pages).all()).toHaveLength(0);
  });

  it('deletes a page together with its comments and tag links, and closes the gap in the order', () => {
    const editor = createAccount({ role: 'admin' });
    const tag = tagsResource.create({ name: 'Bogowie', slug: '' }, editor);
    const root = addPage('Bogowie');
    addPage('Zeus', root);
    const hera = addPage('Hera', root, { tagIds: [tag.id] });
    const ares = addPage('Ares', root, { tagIds: [tag.id] });
    const news = createNews(editor.id);
    createComment('page', hera, editor, '<p>O Herze</p>');
    createComment('page', ares, editor, '<p>O Aresie</p>');
    createComment('news', news.id, editor, '<p>O newsie</p>');

    pagesResource.remove(hera, editor);

    expect(pagesResource.find(hera)).toBeUndefined();
    expect(
      useDb()
        .select()
        .from(schema.comments)
        .all()
        .map((comment) => [comment.targetKind, comment.targetId]),
    ).toEqual([
      ['page', ares],
      ['news', news.id],
    ]);
    expect(useDb().select().from(schema.pageTags).all()).toEqual([{ pageId: ares, tagId: tag.id }]);
    expect(tagsResource.find(tag.id)).toBeDefined();
    expect(childOrder(root)).toEqual([
      { title: 'Zeus', sortOrder: 0 },
      { title: 'Ares', sortOrder: 1 },
    ]);
  });

  it('replaces the tag set on every save', () => {
    const editor = createAccount({ role: 'admin' });
    const gold = tagsResource.create({ name: 'Złoci Rycerze', slug: '' }, editor);
    const omega = tagsResource.create({ name: 'Omega', slug: '' }, editor);
    const page = addPage('Ataki', null, { tagIds: [gold.id] });

    expect(pagesResource.find(page)).toMatchObject({ tagIds: [gold.id] });

    editPage(page, { tagIds: [omega.id], kind: 'hub', status: 'draft', commentsEnabled: false });

    expect(pagesResource.find(page)).toMatchObject({
      tagIds: [omega.id],
      kind: 'hub',
      status: 'draft',
      commentsEnabled: false,
    });
  });

  it('lists one level of the tree with breadcrumbs and the number of sub-pages', () => {
    const root = addPage('Mitologia');
    const greek = addPage('Grecka', root, { kind: 'hub' });
    addPage('Rzymska', root, { status: 'draft' });
    addPage('Bogowie', greek);

    expect(listPageLevel(null).children.map((page) => page.title)).toEqual(['Mitologia']);
    expect(listPageLevel(root)).toEqual({
      breadcrumbs: [{ id: root, title: 'Mitologia' }],
      children: [
        expect.objectContaining({ title: 'Grecka', path: 'mitologia/grecka', kind: 'hub', childCount: 1 }),
        expect.objectContaining({ title: 'Rzymska', path: 'mitologia/rzymska', status: 'draft', childCount: 0 }),
      ],
    });
    expect(listPageLevel(greek).breadcrumbs.map((crumb) => crumb.title)).toEqual(['Mitologia', 'Grecka']);
    expect(() => listPageLevel(999_999)).toThrowError('ERRORS.PAGE_NOT_FOUND');
  });

  it('searches all pages by title and shows their full address', () => {
    const root = addPage('Mitologia');
    const greek = addPage('Grecka', root);
    addPage('Bogowie olimpijscy', greek);
    addPage('Bogowie', addPage('Omega'));

    const found = pagesResource.list({ page: 1, search: 'bogowie', filter: '' }) as {
      items: { path: string }[];
      total: number;
    };
    const everything = pagesResource.list({ page: 1, search: '', filter: '' }) as { total: number };

    expect(found.items.map((page) => page.path)).toEqual(['mitologia/grecka/bogowie-olimpijscy', 'omega/bogowie']);
    expect(found.total).toBe(2);
    expect(everything.total).toBe(5);
  });

  it('offers parent candidates from outside the subtree of the moved page', () => {
    const root = addPage('Bogowie');
    const greek = addPage('Bogowie greccy', root);
    addPage('Bogowie olimpijscy', greek);
    addPage('Bogowie rzymscy', root);
    addPage('Bogowie Asgardu');

    const titlesFor = (movedPageId: number | null) =>
      findParentCandidates('bogowie', movedPageId).map((candidate) => candidate.title);

    expect(titlesFor(null)).toHaveLength(5);
    expect(titlesFor(greek)).toEqual(['Bogowie', 'Bogowie Asgardu', 'Bogowie rzymscy']);
    expect(titlesFor(root)).toEqual(['Bogowie Asgardu']);
    expect(findParentCandidates('rzymscy', greek)).toEqual([
      expect.objectContaining({ title: 'Bogowie rzymscy', path: 'bogowie/bogowie-rzymscy' }),
    ]);
  });
});

const imageUpload = async (filename: string): Promise<MultiPartData> => ({
  name: 'file',
  filename,
  type: 'image/png',
  data: await sharp({ create: { width: 64, height: 48, channels: 3, background: '#0a6c74' } })
    .png()
    .toBuffer(),
});

const isStored = (storedPath: string) => existsSync(join(useRuntimeConfig(event).uploadsDir, storedPath));

const photoOrder = (albumId: number) =>
  useDb()
    .select({ title: schema.photos.title, sortOrder: schema.photos.sortOrder })
    .from(schema.photos)
    .where(eq(schema.photos.albumId, albumId))
    .orderBy(asc(schema.photos.sortOrder), asc(schema.photos.id))
    .all();

describe('album administration', () => {
  beforeEach(resetDatabase);

  const albumInput = { title: 'Fan Arty', slug: '', description: 'Prace fanów', sortOrder: 3 };

  it('creates albums with unique addresses that never collide with the photo address', () => {
    const editor = createAccount({ role: 'admin' });

    const first = albumsResource.create(albumInput, editor);
    const second = albumsResource.create(albumInput, editor);
    const reserved = albumsResource.create({ ...albumInput, title: 'Zdjęcie' }, editor);

    expect(albumsResource.find(first.id)).toMatchObject({ slug: 'fan-arty', description: 'Prace fanów', sortOrder: 3 });
    expect(albumsResource.find(second.id)).toMatchObject({ slug: 'fan-arty-2' });
    expect(albumsResource.find(reserved.id)).toMatchObject({ slug: 'zdjecie-2' });
    expect(() => albumsResource.create({ ...albumInput, title: 'A' }, editor)).toThrowError(
      'VALIDATION.TITLE_TOO_SHORT',
    );
  });

  it('updates an album and keeps its own address', () => {
    const editor = createAccount({ role: 'admin' });
    const { id } = albumsResource.create(albumInput, editor);

    albumsResource.update(id, { title: 'Fan Arty 2', slug: 'fan-arty', description: '', sortOrder: 1 }, editor);

    expect(albumsResource.find(id)).toMatchObject({ title: 'Fan Arty 2', slug: 'fan-arty', sortOrder: 1 });
  });

  it('lists albums in their order with the number of photos', () => {
    const second = createAlbum({ title: 'Tapety', sortOrder: 2 });
    const first = createAlbum({ title: 'Avatary', sortOrder: 1 });
    createPhoto(second.id);
    createPhoto(second.id);

    expect(albumsResource.list({ page: 1, search: '', filter: '' })).toEqual([
      expect.objectContaining({ id: first.id, title: 'Avatary', photoCount: 0 }),
      expect.objectContaining({ id: second.id, title: 'Tapety', photoCount: 2 }),
    ]);
  });

  it('refuses to delete an album that still has photos', async () => {
    const editor = createAccount({ role: 'admin' });
    const album = createAlbum();
    const photo = createPhoto(album.id);

    expect(() => albumsResource.remove(album.id, editor)).toThrowError('ERRORS.ALBUM_HAS_PHOTOS');
    expect(albumsResource.find(album.id)).toBeDefined();

    await removePhoto(event, photo.id);
    albumsResource.remove(album.id, editor);

    expect(albumsResource.find(album.id)).toBeUndefined();
  });
});

describe('photo administration', () => {
  beforeEach(resetDatabase);

  it('stores every uploaded image with a thumbnail at the end of the album order', async () => {
    const uploader = createAccount({ role: 'moderator', permissions: ['gallery'] });
    const album = createAlbum();
    createPhoto(album.id, { title: 'Starsze', sortOrder: 4 });

    const added = await uploadPhotos(
      event,
      album.id,
      [await imageUpload('seiya.png'), await imageUpload('shiryu.png')],
      uploader,
    );

    expect(added).toHaveLength(2);
    expect(added[0]).toMatchObject({ albumId: album.id, authorId: uploader.id, width: 64, height: 48, sortOrder: 5 });
    expect(added[1]).toMatchObject({ authorId: uploader.id, sortOrder: 6 });
    expect(added[0]!.image).toMatch(/^photos\/\d{4}\/[\w-]+\.png$/);
    expect(added[0]!.thumbnail).toMatch(/^thumbnails\/photos\/\d{4}\/[\w-]+\.webp$/);
    expect(added.flatMap((photo) => [photo.image, photo.thumbnail]).every(isStored)).toBe(true);
    expect(albumPhotos(album.slug, 1)?.photos.items.map((photo) => photo.id)).toEqual([
      expect.any(Number),
      added[0]!.id,
      added[1]!.id,
    ]);
  });

  it('rejects files that are not images and uploads to an unknown album', async () => {
    const uploader = createAccount({ role: 'admin' });
    const album = createAlbum();
    const notAnImage: MultiPartData = { name: 'file', filename: 'wirus.png', data: Buffer.from('<?php echo 1;') };

    await expect(uploadPhotos(event, album.id, [notAnImage], uploader)).rejects.toThrowError(
      'ERRORS.IMAGE_FORMAT_NOT_ALLOWED',
    );
    await expect(uploadPhotos(event, 999_999, [await imageUpload('a.png')], uploader)).rejects.toThrowError(
      'ERRORS.ALBUM_NOT_FOUND',
    );
    expect(useDb().select().from(schema.photos).all()).toHaveLength(0);
  });

  it('edits the title and description of a photo', () => {
    const album = createAlbum();
    const photo = createPhoto(album.id);

    updatePhoto(photo.id, { title: '  Pegasus Seiya ', description: 'Brązowy rycerz' });

    expect(listAlbumPhotos(album.id).photos).toEqual([
      expect.objectContaining({ id: photo.id, title: 'Pegasus Seiya', description: 'Brązowy rycerz' }),
    ]);
    expect(() => updatePhoto(999_999, { title: 'Brak' })).toThrowError('ERRORS.PHOTO_NOT_FOUND');
    expect(() => updatePhoto(photo.id, { title: 'x'.repeat(201) })).toThrowError();
  });

  it('deletes a photo with its files, thumbnail and comments, leaving the rest untouched', async () => {
    const uploader = createAccount({ role: 'admin' });
    const album = createAlbum();
    const [removed, kept] = await uploadPhotos(
      event,
      album.id,
      [await imageUpload('a.png'), await imageUpload('b.png')],
      uploader,
    );
    createComment('photo', removed!.id, uploader, '<p>Do usunięcia</p>');
    createComment('photo', kept!.id, uploader, '<p>Zostaje</p>');

    await removePhoto(event, removed!.id);

    expect(listAlbumPhotos(album.id).photos.map((photo) => photo.id)).toEqual([kept!.id]);
    expect([removed!.image, removed!.thumbnail].map(isStored)).toEqual([false, false]);
    expect([kept!.image, kept!.thumbnail].map(isStored)).toEqual([true, true]);
    expect(
      useDb()
        .select()
        .from(schema.comments)
        .all()
        .map((comment) => comment.targetId),
    ).toEqual([kept!.id]);
    await expect(removePhoto(event, removed!.id)).rejects.toThrowError('ERRORS.PHOTO_NOT_FOUND');
  });

  it('sets a photo as the album cover and clears the cover when that photo is deleted', async () => {
    const album = createAlbum();
    const other = createAlbum();
    const cover = createPhoto(album.id);
    const plain = createPhoto(album.id);

    setAlbumCover(cover.id);

    expect(listAlbumPhotos(album.id).album.coverImage).toBe(cover.thumbnail);
    expect(listAlbums().find((listed) => listed.slug === album.slug)?.coverImage).toBe(cover.thumbnail);
    expect(listAlbumPhotos(other.id).album.coverImage).toBeNull();

    await removePhoto(event, plain.id);

    expect(listAlbumPhotos(album.id).album.coverImage).toBe(cover.thumbnail);

    await removePhoto(event, cover.id);

    expect(listAlbumPhotos(album.id).album.coverImage).toBeNull();
    expect(() => setAlbumCover(cover.id)).toThrowError('ERRORS.PHOTO_NOT_FOUND');
  });

  it('moves a photo left and right within its album and keeps the order gap-free', () => {
    const album = createAlbum();
    const other = createAlbum();
    createPhoto(album.id, { title: 'A', sortOrder: 3 });
    const second = createPhoto(album.id, { title: 'B', sortOrder: 10 });
    createPhoto(album.id, { title: 'C', sortOrder: 11 });
    const foreign = createPhoto(other.id, { title: 'Obca', sortOrder: 9 });

    movePhoto(second.id, 'next');

    expect(photoOrder(album.id)).toEqual([
      { title: 'A', sortOrder: 0 },
      { title: 'C', sortOrder: 1 },
      { title: 'B', sortOrder: 2 },
    ]);

    movePhoto(second.id, 'next');
    movePhoto(second.id, 'previous');
    movePhoto(second.id, 'previous');

    expect(photoOrder(album.id).map((photo) => photo.title)).toEqual(['B', 'A', 'C']);
    expect(photoOrder(other.id)).toEqual([{ title: 'Obca', sortOrder: 9 }]);
    expect(() => movePhoto(foreign.id + 1000, 'next')).toThrowError('ERRORS.PHOTO_NOT_FOUND');
  });
});
