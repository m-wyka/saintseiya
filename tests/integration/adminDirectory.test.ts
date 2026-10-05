import { beforeEach, describe, expect, it } from 'vitest';
import { addDownload, downloadDetailsFrom, downloadsResource } from '../../server/admin/directory/downloads';
import { linkCategoriesResource } from '../../server/admin/directory/linkCategories';
import { linksResource } from '../../server/admin/directory/links';
import {
  findNavigationLink,
  moveNavigationLink,
  navigationLinksResource,
} from '../../server/admin/directory/navigationLinks';
import { moveNavigationSection, navigationSectionsResource } from '../../server/admin/directory/navigationSections';
import { pollsResource } from '../../server/admin/directory/polls';
import { videoCategoriesResource } from '../../server/admin/directory/videoCategories';
import { videosResource } from '../../server/admin/directory/videos';
import { directoryResources } from '../../server/admin/groups/directory';
import { castPollVote, createComment } from '../../server/utils/communityWrites';
import { schema, useDb } from '../../server/utils/db';
import { linkDirectory, listDownloads } from '../../server/utils/directory';
import { siteLayout } from '../../server/utils/layout';
import { listPolls } from '../../server/utils/polls';
import { listVideoCategories, listVideos } from '../../server/utils/videos';
import { messageKey } from '../../shared/utils/messages';
import { withMovedItem } from '../../shared/utils/ordering';
import { createAccount, createPoll, resetDatabase } from './fixtures';

const EVERYTHING = { page: 1, search: '', filter: '' };

interface StoredPollView {
  question: string;
  endedAt: Date | null;
  isClosed: boolean;
  options: { id: number; label: string; voteCount: number }[];
}

const admin = () => createAccount({ role: 'admin' });

const createVideoCategory = (name = 'AMV', sortOrder = 0) =>
  videoCategoriesResource.create({ name, slug: '', description: '', sortOrder }, admin());

const createLinkCategory = (name = 'Polskie strony', sortOrder = 0) =>
  linkCategoriesResource.create({ name, sortOrder }, admin());

const createSection = (title: string) => navigationSectionsResource.create({ title }, admin());

const createNavigationLink = (sectionId: number, label: string, url = '/forum') =>
  navigationLinksResource.create({ sectionId, groupTitle: null, label, url }, admin());

const storedPoll = (id: number) => pollsResource.find(id) as StoredPollView;

const menu = () => siteLayout().navigation.map((section) => [section.title, section.links.map((link) => link.label)]);

describe('directory resources', () => {
  it('guards every resource with the permission of its section', () => {
    const accessByName = Object.fromEntries(
      Object.entries(directoryResources).map(([name, resource]) => [name, resource.access]),
    );

    expect(accessByName).toEqual({
      'video-categories': 'videos',
      videos: 'videos',
      'link-categories': 'links',
      links: 'links',
      downloads: 'downloads',
      polls: 'polls',
      'navigation-sections': 'admin',
      'navigation-links': 'admin',
    });
  });
});

describe('ordering', () => {
  it('swaps an item with its neighbour and leaves the list alone at the edges', () => {
    expect(withMovedItem(['a', 'b', 'c'], 1, 'previous')).toEqual(['b', 'a', 'c']);
    expect(withMovedItem(['a', 'b', 'c'], 1, 'next')).toEqual(['a', 'c', 'b']);
    expect(withMovedItem(['a', 'b', 'c'], 0, 'previous')).toEqual(['a', 'b', 'c']);
    expect(withMovedItem(['a', 'b', 'c'], 2, 'next')).toEqual(['a', 'b', 'c']);
    expect(withMovedItem(['a', 'b', 'c'], -1, 'next')).toEqual(['a', 'b', 'c']);
  });
});

describe('video administration', () => {
  beforeEach(resetDatabase);

  it('creates categories with unique generated addresses in the chosen order', () => {
    createVideoCategory('Openingi i Endingi', 2);
    createVideoCategory('Openingi i Endingi', 1);

    expect(listVideoCategories().map((category) => category.slug)).toEqual([
      'openingi-i-endingi-2',
      'openingi-i-endingi',
    ]);
  });

  it('stores the video identifier taken from an address or given directly', () => {
    const editor = admin();
    const category = createVideoCategory();
    const video = { title: 'Pegasus Fantasy', description: '', categoryId: category.id };

    const addresses = [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s',
      ' https://youtu.be/dQw4w9WgXcQ ',
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
      'dQw4w9WgXcQ',
    ];
    addresses.forEach((youtubeId) => videosResource.create({ ...video, youtubeId }, editor));

    const stored = useDb().select().from(schema.videos).all();
    expect(stored.map((row) => row.youtubeId)).toEqual(addresses.map(() => 'dQw4w9WgXcQ'));
    expect(stored.every((row) => row.authorId === editor.id)).toBe(true);
    expect(listVideos(1, 'amv').total).toBe(addresses.length);
  });

  it('rejects anything that is not a YouTube video or points to a missing category', () => {
    const editor = admin();
    const category = createVideoCategory();
    const video = { title: 'Pegasus Fantasy', description: '', categoryId: category.id, youtubeId: 'dQw4w9WgXcQ' };

    expect(() => videosResource.create({ ...video, youtubeId: 'https://vimeo.com/123456789' }, editor)).toThrowError(
      'VALIDATION.YOUTUBE_VIDEO_REQUIRED',
    );
    expect(() => videosResource.create({ ...video, youtubeId: 'za-krotkie' }, editor)).toThrowError(
      'VALIDATION.YOUTUBE_VIDEO_REQUIRED',
    );
    expect(() => videosResource.create({ ...video, youtubeId: '' }, editor)).toThrowError(
      'VALIDATION.YOUTUBE_VIDEO_REQUIRED',
    );
    expect(() => videosResource.create({ ...video, categoryId: category.id + 1 }, editor)).toThrowError(
      'VALIDATION.CATEGORY_REQUIRED',
    );
    expect(() => videosResource.create({ ...video, title: 'A' }, editor)).toThrowError('VALIDATION.TITLE_TOO_SHORT');
  });

  it('updates a video and finds it by title', () => {
    const editor = admin();
    const amv = createVideoCategory('AMV');
    const games = createVideoCategory('Gry');
    const { id } = videosResource.create(
      { title: 'Pegasus Fantasy', description: '', categoryId: amv.id, youtubeId: 'dQw4w9WgXcQ' },
      editor,
    );

    videosResource.update(
      id,
      { title: 'Zwiastun gry', description: 'Opis', categoryId: games.id, youtubeId: 'https://youtu.be/4sQt4n9YEfw' },
      editor,
    );

    const found = videosResource.list({ ...EVERYTHING, search: 'zwiastun' }) as {
      items: { title: string; youtubeId: string; categoryName: string }[];
      total: number;
    };
    expect(found.items).toMatchObject([{ title: 'Zwiastun gry', youtubeId: '4sQt4n9YEfw', categoryName: 'Gry' }]);
    expect((videosResource.list({ ...EVERYTHING, search: 'pegasus' }) as { total: number }).total).toBe(0);
  });

  it('keeps a category while it has videos and removes a video with its comments', () => {
    const editor = admin();
    const category = createVideoCategory();
    const { id } = videosResource.create(
      { title: 'Pegasus Fantasy', description: '', categoryId: category.id, youtubeId: 'dQw4w9WgXcQ' },
      editor,
    );
    createComment('video', id, editor, '<p>Komentarz</p>');

    expect(() => videoCategoriesResource.remove(category.id, editor)).toThrowError('ERRORS.VIDEO_CATEGORY_HAS_VIDEOS');

    videosResource.remove(id, editor);
    videoCategoriesResource.remove(category.id, editor);

    expect(useDb().select().from(schema.comments).all()).toHaveLength(0);
    expect(listVideoCategories()).toHaveLength(0);
  });
});

describe('link administration', () => {
  beforeEach(resetDatabase);

  it('publishes links in the directory under their categories', () => {
    const editor = admin();
    const foreign = createLinkCategory('Zagraniczne strony', 1);
    const polish = createLinkCategory('Polskie strony', 0);
    createLinkCategory('Pusta kategoria', 2);
    linksResource.create(
      { title: 'Cav Zodiaco', description: '', url: 'https://www.cavzodiaco.com.br/', categoryId: foreign.id },
      editor,
    );
    linksResource.create(
      { title: 'Bractwo', description: 'Forum', url: ' http://ssbzz.forumpl.net/ ', categoryId: polish.id },
      editor,
    );

    expect(linkDirectory()).toMatchObject([
      { name: 'Polskie strony', links: [{ title: 'Bractwo', url: 'http://ssbzz.forumpl.net/' }] },
      { name: 'Zagraniczne strony', links: [{ title: 'Cav Zodiaco' }] },
    ]);
  });

  it('accepts only web addresses and existing categories', () => {
    const editor = admin();
    const category = createLinkCategory();
    const link = { title: 'Strona', description: '', url: 'https://example.com/', categoryId: category.id };

    ['javascript:alert(1)', 'ftp://example.com/plik', 'example.com', '/linki', ''].forEach((url) =>
      expect(() => linksResource.create({ ...link, url }, editor)).toThrowError('VALIDATION.WEB_URL_REQUIRED'),
    );
    expect(() => linksResource.create({ ...link, categoryId: category.id + 1 }, editor)).toThrowError(
      'VALIDATION.CATEGORY_REQUIRED',
    );
  });

  it('updates a link, finds it by title or address and keeps a category while it has links', () => {
    const editor = admin();
    const category = createLinkCategory();
    const { id } = linksResource.create(
      { title: 'Strona', description: '', url: 'https://example.com/', categoryId: category.id },
      editor,
    );

    linksResource.update(
      id,
      {
        title: 'Saint Seiya Wiki',
        description: 'Encyklopedia',
        url: 'https://wiki.example.org/',
        categoryId: category.id,
      },
      editor,
    );

    const byAddress = linksResource.list({ ...EVERYTHING, search: 'wiki.example' }) as { items: { title: string }[] };
    expect(byAddress.items.map((link) => link.title)).toEqual(['Saint Seiya Wiki']);
    expect(() => linkCategoriesResource.remove(category.id, editor)).toThrowError('ERRORS.LINK_CATEGORY_HAS_LINKS');

    linksResource.remove(id, editor);
    linkCategoriesResource.remove(category.id, editor);

    expect(linkCategoriesResource.list(EVERYTHING)).toEqual([]);
  });
});

describe('download administration', () => {
  beforeEach(resetDatabase);

  it('adds an uploaded file, edits its details and removes it', () => {
    const editor = admin();
    const details = downloadDetailsFrom({ title: ' Napisy PL ', description: 'Legend of Sanctuary' });

    const { id } = addDownload(details, { file: 'downloads/2026/napisy.zip', fileSize: 2048 });
    downloadsResource.update(id, { title: 'Napisy PL (poprawione)', description: '' }, editor);

    expect(listDownloads()).toMatchObject([{ id, title: 'Napisy PL (poprawione)', description: '', fileSize: 2048 }]);
    expect(downloadsResource.find(id)).toMatchObject({ file: 'downloads/2026/napisy.zip', downloadCount: 0 });

    downloadsResource.remove(id, editor);

    expect(downloadsResource.list(EVERYTHING)).toEqual([]);
  });

  it('requires a title and an uploaded file', () => {
    expect(() => downloadDetailsFrom({ title: 'A', description: '' })).toThrowError('VALIDATION.TITLE_TOO_SHORT');
    expect(() => downloadsResource.create({ title: 'Napisy PL', description: '' }, admin())).toThrowError(
      'ERRORS.DOWNLOAD_REQUIRES_UPLOAD',
    );
  });
});

describe('poll administration', () => {
  beforeEach(resetDatabase);

  it('creates an open poll with options in the given order', () => {
    const { id } = pollsResource.create(
      { question: 'Ulubiona saga?', options: [{ label: 'Hades' }, { label: ' Posejdon ' }, { label: 'Asgard' }] },
      admin(),
    );

    const [poll] = listPolls(1, null).items;
    expect(poll).toMatchObject({ id, question: 'Ulubiona saga?', isOpen: true });
    expect(poll?.options.map((option) => option.label)).toEqual(['Hades', 'Posejdon', 'Asgard']);
  });

  it('requires from two to ten distinct, non-empty options', () => {
    const editor = admin();
    const labelled = (count: number) => Array.from({ length: count }, (_, index) => ({ label: `Opcja ${index + 1}` }));
    const create = (options: { label: string }[]) =>
      pollsResource.create({ question: 'Ulubiona saga?', options }, editor);

    expect(() => create(labelled(1))).toThrowError(messageKey('VALIDATION.POLL_TOO_FEW_OPTIONS', { min: 2 }));
    expect(() => create(labelled(11))).toThrowError(messageKey('VALIDATION.POLL_TOO_MANY_OPTIONS', { max: 10 }));
    expect(() => create([{ label: 'Hades' }, { label: '  ' }])).toThrowError('VALIDATION.POLL_OPTION_EMPTY');
    expect(() => create([{ label: 'Hades' }, { label: 'hades' }])).toThrowError('VALIDATION.POLL_OPTIONS_NOT_DISTINCT');
    expect(create(labelled(10)).id).toBeGreaterThan(0);
  });

  it('keeps archived and live votes of kept options and drops removed options with their votes', () => {
    const editor = admin();
    const { poll, options } = createPoll();
    const [seiya, shiryu] = options;
    castPollVote(poll.id, seiya!.id, createAccount());
    castPollVote(poll.id, shiryu!.id, createAccount());

    pollsResource.update(
      poll.id,
      {
        question: 'Ulubiony rycerz z brązu?',
        options: [
          { id: null, label: 'Hyoga' },
          { id: seiya!.id, label: 'Seiya z Pegaza' },
        ],
        isClosed: false,
      },
      editor,
    );

    expect(storedPoll(poll.id)).toMatchObject({
      question: 'Ulubiony rycerz z brązu?',
      options: [
        { label: 'Hyoga', voteCount: 0 },
        { id: seiya!.id, label: 'Seiya z Pegaza', voteCount: 6 },
      ],
    });
    expect(useDb().select().from(schema.pollVotes).all()).toMatchObject([{ optionId: seiya!.id }]);
  });

  it('refuses options of another poll and leaves the poll untouched', () => {
    const { poll } = createPoll();
    const other = createPoll();

    expect(() =>
      pollsResource.update(
        poll.id,
        {
          question: 'Zmienione pytanie',
          options: [{ id: other.options[0]!.id, label: 'Cudza' }, { label: 'Nowa' }],
          isClosed: false,
        },
        admin(),
      ),
    ).toThrowError('ERRORS.POLL_CHANGED');
    expect(storedPoll(poll.id)).toMatchObject({
      question: 'Ulubiony rycerz?',
      options: [{ label: 'Seiya' }, { label: 'Shiryu' }],
    });
  });

  it('closes a poll once and reopens it', () => {
    const editor = admin();
    const { poll, options } = createPoll({ isClosed: true });
    const kept = { question: poll.question, options: options.map(({ id, label }) => ({ id, label })) };

    pollsResource.update(poll.id, { ...kept, isClosed: true }, editor);
    expect(storedPoll(poll.id)).toMatchObject({ isClosed: true, endedAt: poll.endedAt });
    expect(() => castPollVote(poll.id, options[0]!.id, createAccount())).toThrowError('ERRORS.POLL_UNAVAILABLE');

    pollsResource.update(poll.id, { ...kept, isClosed: false }, editor);
    expect(storedPoll(poll.id)).toMatchObject({ isClosed: false, endedAt: null });
    expect(() => castPollVote(poll.id, options[0]!.id, createAccount())).not.toThrow();

    pollsResource.update(poll.id, { ...kept, isClosed: true }, editor);
    expect(storedPoll(poll.id).endedAt).toBeInstanceOf(Date);
    expect(storedPoll(poll.id).endedAt).not.toEqual(poll.endedAt);
  });

  it('lists polls with vote totals, search and status filter', () => {
    const open = createPoll();
    createPoll({ isClosed: true });
    castPollVote(open.poll.id, open.options[1]!.id, createAccount());
    pollsResource.create(
      { question: 'Najlepszy opening?', options: [{ label: 'Pegasus Fantasy' }, { label: 'Soldier Dream' }] },
      admin(),
    );

    const listed = (query: Partial<typeof EVERYTHING>) =>
      pollsResource.list({ ...EVERYTHING, ...query }) as { items: { id: number; totalVotes: number }[]; total: number };

    expect(listed({}).total).toBe(3);
    expect(listed({ filter: 'closed' }).total).toBe(1);
    expect(listed({ filter: 'open' }).total).toBe(2);
    expect(listed({ search: 'opening' }).items).toMatchObject([{ totalVotes: 0 }]);
    expect(listed({ filter: 'open', search: 'rycerz' }).items).toMatchObject([{ id: open.poll.id, totalVotes: 6 }]);
  });

  it('removes a poll together with its options and votes', () => {
    const { poll, options } = createPoll();
    castPollVote(poll.id, options[0]!.id, createAccount());

    pollsResource.remove(poll.id, admin());

    expect(pollsResource.find(poll.id)).toBeUndefined();
    expect(useDb().select().from(schema.pollOptions).all()).toHaveLength(0);
    expect(useDb().select().from(schema.pollVotes).all()).toHaveLength(0);
  });
});

describe('navigation administration', () => {
  beforeEach(resetDatabase);

  it('appends new sections and links at the end of the menu', () => {
    const main = createSection('Menu główne');
    const fans = createSection('Fans');
    createNavigationLink(main.id, 'Strona główna', '/');
    createNavigationLink(fans.id, 'Fanarty', '/fans/fanarty');
    createNavigationLink(main.id, 'Forum', '/forum');

    expect(menu()).toEqual([
      ['Menu główne', ['Strona główna', 'Forum']],
      ['Fans', ['Fanarty']],
    ]);
  });

  it('accepts portal paths and web addresses and stores an empty group as none', () => {
    const editor = admin();
    const section = createSection('Menu główne');
    const link = { sectionId: section.id, groupTitle: '  ', label: 'Forum', url: '/forum' };

    const internal = navigationLinksResource.create(link, editor);
    const external = navigationLinksResource.create(
      { ...link, groupTitle: ' Partnerzy ', url: 'https://example.com/' },
      editor,
    );

    expect(findNavigationLink(internal.id)).toMatchObject({ groupTitle: null, url: '/forum' });
    expect(findNavigationLink(external.id)).toMatchObject({ groupTitle: 'Partnerzy', url: 'https://example.com/' });
    ['forum', '//example.com', '/\\example.com', 'javascript:alert(1)', 'mailto:a@example.com', ''].forEach((url) =>
      expect(() => navigationLinksResource.create({ ...link, url }, editor)).toThrowError(
        'VALIDATION.INTERNAL_OR_WEB_URL_REQUIRED',
      ),
    );
    expect(() => navigationLinksResource.create({ ...link, sectionId: section.id + 1 }, editor)).toThrowError(
      'VALIDATION.SECTION_REQUIRED',
    );
    expect(() => navigationLinksResource.create({ ...link, label: ' ' }, editor)).toThrowError(
      'VALIDATION.LINK_LABEL_REQUIRED',
    );
  });

  it('moves sections and links one place at a time', () => {
    const main = createSection('Menu główne');
    createSection('Informacje');
    const fans = createSection('Fans');
    createNavigationLink(main.id, 'Strona główna', '/');
    createNavigationLink(main.id, 'Forum');
    const rules = createNavigationLink(main.id, 'Regulamin', '/regulamin');

    moveNavigationSection(fans.id, 'previous');
    moveNavigationSection(fans.id, 'previous');
    moveNavigationSection(fans.id, 'previous');
    moveNavigationLink(findNavigationLink(rules.id)!, 'previous');

    expect(menu()).toEqual([
      ['Fans', []],
      ['Menu główne', ['Strona główna', 'Regulamin', 'Forum']],
      ['Informacje', []],
    ]);

    moveNavigationSection(fans.id, 'next');
    moveNavigationLink(findNavigationLink(rules.id)!, 'next');
    moveNavigationLink(findNavigationLink(rules.id)!, 'next');

    expect(menu()).toEqual([
      ['Menu główne', ['Strona główna', 'Forum', 'Regulamin']],
      ['Fans', []],
      ['Informacje', []],
    ]);
  });

  it('keeps the place of an edited link and appends it when it changes section', () => {
    const editor = admin();
    const main = createSection('Menu główne');
    const fans = createSection('Fans');
    const home = createNavigationLink(main.id, 'Strona główna', '/');
    createNavigationLink(main.id, 'Forum');
    createNavigationLink(fans.id, 'Fanarty', '/fans/fanarty');

    navigationLinksResource.update(home.id, { sectionId: main.id, groupTitle: null, label: 'Start', url: '/' }, editor);
    expect(menu()).toEqual([
      ['Menu główne', ['Start', 'Forum']],
      ['Fans', ['Fanarty']],
    ]);

    navigationLinksResource.update(home.id, { sectionId: fans.id, groupTitle: null, label: 'Start', url: '/' }, editor);
    expect(menu()).toEqual([
      ['Menu główne', ['Forum']],
      ['Fans', ['Fanarty', 'Start']],
    ]);
  });

  it('renames a section and removes it together with its links', () => {
    const editor = admin();
    const main = createSection('Menu główne');
    const partners = createSection('Partnerzy');
    createNavigationLink(partners.id, 'Sklep', 'https://example.com/');

    navigationSectionsResource.update(main.id, { title: 'Portal' }, editor);
    navigationSectionsResource.remove(partners.id, editor);

    expect(menu()).toEqual([['Portal', []]]);
    expect(navigationLinksResource.list(EVERYTHING)).toEqual([]);
    expect(() => navigationSectionsResource.create({ title: 'A' }, editor)).toThrowError('VALIDATION.TITLE_TOO_SHORT');
  });
});
