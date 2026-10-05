import type { ModeratorPermission, UserRole } from '../../shared/utils/roles';
import { userNameKey } from '../../shared/utils/users';
import { schema, useDb } from '../../server/utils/db';

let sequence = 0;

const nextNumber = (): number => {
  sequence += 1;
  return sequence;
};

const TABLES_IN_DELETION_ORDER = [
  schema.translations,
  schema.pollVotes,
  schema.pollOptions,
  schema.polls,
  schema.shouts,
  schema.comments,
  schema.posts,
  schema.threads,
  schema.forums,
  schema.forumCategories,
  schema.newsTags,
  schema.pageTags,
  schema.tags,
  schema.news,
  schema.newsCategories,
  schema.mapAreas,
  schema.maps,
  schema.pages,
  schema.photos,
  schema.albums,
  schema.videos,
  schema.videoCategories,
  schema.links,
  schema.linkCategories,
  schema.faqItems,
  schema.faqCategories,
  schema.downloads,
  schema.mediaImages,
  schema.externalImages,
  schema.navigationLinks,
  schema.navigationSections,
  schema.settings,
  schema.auditLogs,
  schema.users,
];

export const resetDatabase = () => {
  const db = useDb();
  TABLES_IN_DELETION_ORDER.forEach((table) => db.delete(table).run());
};

interface AccountOptions {
  name?: string;
  role?: UserRole;
  permissions?: ModeratorPermission[];
  isGhost?: boolean;
  bannedAt?: Date | null;
}

export const createAccount = (options: AccountOptions = {}) => {
  const number = nextNumber();
  const name = options.name ?? `Rycerz ${number}`;
  return useDb()
    .insert(schema.users)
    .values({
      name,
      nameKey: userNameKey(name),
      googleId: options.isGhost ? null : `google-${number}`,
      role: options.role ?? 'user',
      permissions: options.permissions ?? [],
      isGhost: options.isGhost ?? false,
      bannedAt: options.bannedAt ?? null,
    })
    .returning()
    .get();
};

export const createForum = (options: { isStaffOnly?: boolean } = {}) => {
  const db = useDb();
  const number = nextNumber();
  const category = db
    .insert(schema.forumCategories)
    .values({ name: `Kategoria ${number}` })
    .returning()
    .get();
  return db
    .insert(schema.forums)
    .values({
      categoryId: category.id,
      slug: `dzial-${number}`,
      name: `Dział ${number}`,
      isStaffOnly: options.isStaffOnly ?? false,
    })
    .returning()
    .get();
};

export const createNewsCategory = (name = `Kategoria ${nextNumber()}`) =>
  useDb()
    .insert(schema.newsCategories)
    .values({ name, slug: `kategoria-${nextNumber()}` })
    .returning()
    .get();

export const createNews = (authorId: number, values: Partial<typeof schema.news.$inferInsert> = {}) => {
  const number = nextNumber();
  return useDb()
    .insert(schema.news)
    .values({
      slug: `news-${number}`,
      title: `News ${number}`,
      excerptHtml: '<p>Zajawka</p>',
      authorId,
      status: 'published',
      publishedAt: new Date(2020, 0, number),
      ...values,
    })
    .returning()
    .get();
};

export const createPage = (values: Partial<typeof schema.pages.$inferInsert> & { path: string }) =>
  useDb()
    .insert(schema.pages)
    .values({
      slug: values.path.split('/').at(-1)!,
      title: `Strona ${nextNumber()}`,
      bodyHtml: '<p>Treść</p>',
      status: 'published',
      ...values,
    })
    .returning()
    .get();

export const createPoll = (options: { isClosed?: boolean } = {}) => {
  const db = useDb();
  const poll = db
    .insert(schema.polls)
    .values({
      question: 'Ulubiony rycerz?',
      startedAt: new Date(2024, 0, 1),
      endedAt: options.isClosed ? new Date(2024, 1, 1) : null,
    })
    .returning()
    .get();
  const optionRows = db
    .insert(schema.pollOptions)
    .values([
      { pollId: poll.id, label: 'Seiya', sortOrder: 0, archivedVoteCount: 5 },
      { pollId: poll.id, label: 'Shiryu', sortOrder: 1 },
    ])
    .returning()
    .all();
  return { poll, options: optionRows };
};

export const createAlbum = (values: Partial<typeof schema.albums.$inferInsert> = {}) => {
  const number = nextNumber();
  return useDb()
    .insert(schema.albums)
    .values({ slug: `album-${number}`, title: `Album ${number}`, ...values })
    .returning()
    .get();
};

export const createPhoto = (albumId: number, values: Partial<typeof schema.photos.$inferInsert> = {}) => {
  const number = nextNumber();
  return useDb()
    .insert(schema.photos)
    .values({
      albumId,
      image: `photos/zdjecie-${number}.jpg`,
      thumbnail: `thumbnails/photos/zdjecie-${number}.webp`,
      width: 800,
      height: 600,
      ...values,
    })
    .returning()
    .get();
};
