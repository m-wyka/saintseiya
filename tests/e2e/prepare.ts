import { mkdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import sharp from 'sharp';
import { createDb, schema } from '../../server/db';
import { userNameKey } from '../../shared/utils/users';
import { E2E_DB_PATH, E2E_UPLOADS_DIR } from './environment';

const SQLITE_SIDE_FILES = ['', '-wal', '-shm'];
const MAP_IMAGE = { path: 'maps/mapa-nieba.png', width: 800, height: 600 };
const PHOTO_IMAGE = { path: 'photos/tapeta.png', thumbnail: 'thumbnails/photos/tapeta.webp', width: 640, height: 400 };
const DEAD_IMAGE_URL = 'http://dead.example/zaginiony.jpg';

const writeSolidImage = async (storedPath: string, width: number, height: number, color: string) => {
  const file = join(resolve(E2E_UPLOADS_DIR), storedPath);
  mkdirSync(dirname(file), { recursive: true });
  await sharp({ create: { width, height, channels: 3, background: color } }).toFile(file);
};

const resetStorage = () => {
  SQLITE_SIDE_FILES.forEach((suffix) => rmSync(`${resolve(E2E_DB_PATH)}${suffix}`, { force: true }));
  rmSync(resolve(E2E_UPLOADS_DIR), { recursive: true, force: true });
};

const seed = async () => {
  resetStorage();
  await writeSolidImage(MAP_IMAGE.path, MAP_IMAGE.width, MAP_IMAGE.height, '#06171e');
  await writeSolidImage(PHOTO_IMAGE.path, PHOTO_IMAGE.width, PHOTO_IMAGE.height, '#ff9b0d');
  await writeSolidImage(PHOTO_IMAGE.thumbnail, 320, 200, '#ff9b0d');

  const db = createDb(resolve(E2E_DB_PATH));
  const ghost = db
    .insert(schema.users)
    .values({ name: 'Hekate', nameKey: userNameKey('Hekate'), isGhost: true, legacyId: 2 })
    .returning()
    .get();

  const category = db
    .insert(schema.newsCategories)
    .values({ slug: 'manga', name: 'Manga', legacyId: 27 })
    .returning()
    .get();
  const tag = db.insert(schema.tags).values({ slug: 'lost-canvas', name: 'Lost Canvas' }).returning().get();
  const news = db
    .insert(schema.news)
    .values({
      slug: 'saint-seiya-revolution-powraca',
      title: 'Saint Seiya Revolution powraca!',
      excerptHtml: '<p>Garść informacji o powrocie portalu.</p>',
      bodyHtml: `<p>Pełna treść newsa o powrocie.</p><p><img src="${DEAD_IMAGE_URL}" alt="" /></p>`,
      categoryId: category.id,
      authorId: ghost.id,
      status: 'published',
      publishedAt: new Date('2019-12-27T22:11:54Z'),
      legacyId: 409,
    })
    .returning()
    .get();
  db.insert(schema.newsTags).values({ newsId: news.id, tagId: tag.id }).run();
  db.insert(schema.news)
    .values({
      slug: 'szkic-redakcyjny',
      title: 'Szkic redakcyjny',
      excerptHtml: '<p>Niewidoczny</p>',
      authorId: ghost.id,
      status: 'draft',
    })
    .run();
  db.insert(schema.externalImages).values({ url: DEAD_IMAGE_URL, status: 'dead' }).run();
  db.insert(schema.comments)
    .values({ targetKind: 'news', targetId: news.id, authorId: ghost.id, bodyHtml: '<p>Świetna wiadomość!</p>' })
    .run();

  const mythology = db
    .insert(schema.pages)
    .values({
      slug: 'mitologia',
      path: 'mitologia',
      title: 'Mitologia',
      kind: 'hub',
      status: 'published',
      commentsEnabled: false,
    })
    .returning()
    .get();
  const greek = db
    .insert(schema.pages)
    .values({
      parentId: mythology.id,
      slug: 'grecka',
      path: 'mitologia/grecka',
      title: 'Grecka',
      bodyHtml: '<p>Wstęp do mitologii greckiej. <a href="/mitologia/grecka/posejdon">Posejdon</a></p>',
      status: 'published',
      legacyId: 335,
    })
    .returning()
    .get();
  const poseidon = db
    .insert(schema.pages)
    .values({
      parentId: greek.id,
      slug: 'posejdon',
      path: 'mitologia/grecka/posejdon',
      title: 'Posejdon',
      bodyHtml: '<p>Władca mórz, brat Zeusa i Hadesa.</p>',
      status: 'published',
      legacyId: 367,
    })
    .returning()
    .get();
  db.insert(schema.pages)
    .values({
      slug: 'regulamin',
      path: 'regulamin',
      title: 'Regulamin',
      bodyHtml: '<p>Zasady portalu.</p>',
      status: 'published',
    })
    .run();

  const forumCategory = db
    .insert(schema.forumCategories)
    .values({ name: 'Saint Seiya', sortOrder: 1 })
    .returning()
    .get();
  const forum = db
    .insert(schema.forums)
    .values({
      categoryId: forumCategory.id,
      slug: 'postacie',
      name: 'Postacie',
      description: 'Dyskusje o bohaterach.',
      threadCount: 1,
      postCount: 2,
      legacyId: 20,
    })
    .returning()
    .get();
  db.insert(schema.forums)
    .values({
      categoryId: forumCategory.id,
      slug: 'redakcja',
      name: 'Redakcja',
      description: 'Sprawy redakcji.',
      isStaffOnly: true,
      sortOrder: 2,
    })
    .run();
  const thread = db
    .insert(schema.threads)
    .values({
      forumId: forum.id,
      title: 'Ulubiony rycerz',
      authorId: ghost.id,
      postCount: 2,
      lastPostAt: new Date('2019-07-19T10:00:00Z'),
      lastPostAuthorId: ghost.id,
      legacyId: 126,
      createdAt: new Date('2019-07-18T10:00:00Z'),
    })
    .returning()
    .get();
  db.insert(schema.posts)
    .values([
      {
        threadId: thread.id,
        authorId: ghost.id,
        bodyHtml: '<p>Kto jest waszym ulubionym rycerzem?</p>',
        legacyId: 1581,
        createdAt: new Date('2019-07-18T10:00:00Z'),
      },
      {
        threadId: thread.id,
        authorId: ghost.id,
        bodyHtml: '<p>Dla mnie Shiryu.</p>',
        legacyId: 1582,
        createdAt: new Date('2019-07-19T10:00:00Z'),
      },
    ])
    .run();

  const album = db
    .insert(schema.albums)
    .values({
      slug: 'tapety',
      title: 'Tapety',
      description: 'Tapety na pulpit.',
      coverImage: PHOTO_IMAGE.thumbnail,
      legacyId: 9,
    })
    .returning()
    .get();
  const photo = db
    .insert(schema.photos)
    .values({
      albumId: album.id,
      title: 'Złota zbroja',
      image: PHOTO_IMAGE.path,
      thumbnail: PHOTO_IMAGE.thumbnail,
      width: PHOTO_IMAGE.width,
      height: PHOTO_IMAGE.height,
      authorId: ghost.id,
    })
    .returning()
    .get();
  db.insert(schema.comments)
    .values({
      targetKind: 'photo',
      targetId: photo.id,
      authorId: ghost.id,
      bodyHtml: '<p>Piękna zbroja!</p>',
      createdAt: new Date('2019-12-28T10:00:00Z'),
    })
    .run();

  const videoCategory = db
    .insert(schema.videoCategories)
    .values({ slug: 'amv', name: 'AMV', description: 'Fanowskie teledyski.' })
    .returning()
    .get();
  db.insert(schema.videos)
    .values({
      categoryId: videoCategory.id,
      title: 'Pegasus Fantasy',
      description: 'Opening',
      youtubeId: 'dEY9fXqqaFE',
      authorId: ghost.id,
    })
    .run();

  const map = db
    .insert(schema.maps)
    .values({
      slug: 'mapa-nieba',
      title: 'Mapa Nieba',
      description: 'Gwiazdozbiory rycerzy.',
      image: MAP_IMAGE.path,
      imageWidth: MAP_IMAGE.width,
      imageHeight: MAP_IMAGE.height,
      status: 'published',
    })
    .returning()
    .get();
  db.insert(schema.mapAreas)
    .values([
      {
        mapId: map.id,
        label: 'Wieloryb',
        leftPercent: 10,
        topPercent: 10,
        widthPercent: 20,
        heightPercent: 20,
        targetKind: 'content',
        contentHtml: '<p>Gwiazdozbiór Wieloryba (Cetus).</p>',
      },
      {
        mapId: map.id,
        label: 'Posejdon',
        leftPercent: 50,
        topPercent: 50,
        widthPercent: 20,
        heightPercent: 20,
        targetKind: 'page',
        pageId: poseidon.id,
        sortOrder: 1,
      },
    ])
    .run();

  const poll = db
    .insert(schema.polls)
    .values({ question: 'Która seria jest najlepsza?', startedAt: new Date('2024-01-01T00:00:00Z') })
    .returning()
    .get();
  db.insert(schema.pollOptions)
    .values([
      { pollId: poll.id, label: 'Sanktuarium', sortOrder: 0, archivedVoteCount: 3 },
      { pollId: poll.id, label: 'Hades', sortOrder: 1, archivedVoteCount: 1 },
    ])
    .run();

  const linkCategory = db.insert(schema.linkCategories).values({ name: 'Polskie strony' }).returning().get();
  db.insert(schema.links)
    .values({
      categoryId: linkCategory.id,
      title: 'Saint Seiya Wiki',
      description: 'Encyklopedia',
      url: 'https://example.com/wiki',
    })
    .run();
  db.insert(schema.shouts).values({ authorId: ghost.id, bodyHtml: 'Witajcie, rycerze!' }).run();

  const section = db.insert(schema.navigationSections).values({ title: 'Menu główne' }).returning().get();
  db.insert(schema.navigationLinks)
    .values([
      { sectionId: section.id, label: 'Regulamin', url: '/regulamin', sortOrder: 0 },
      { sectionId: section.id, groupTitle: 'Mitologia', label: 'Grecka', url: '/mitologia/grecka', sortOrder: 1 },
    ])
    .run();
  db.insert(schema.settings)
    .values({
      key: 'newsCenterTabs',
      value: [{ title: 'Gorący news', bodyHtml: '<p>Nowy rozdział mangi już dostępny.</p>' }],
    })
    .run();

  db.$client.close();
};

await seed();
