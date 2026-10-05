import { and, asc, count, eq, inArray, isNull, like, max, ne, notLike, sql } from 'drizzle-orm';
import { z } from 'zod';
import { CONTENT_STATUSES, PAGE_KINDS } from '#shared/utils/content';
import { RESERVED_ROOT_SEGMENTS } from '#shared/utils/routes';
import type { Tx } from '../../db';
import type { MoveDirection } from '#shared/utils/ordering';
import { movedOrder } from './ordering';
import { descendantPaths, isInsideSubtree, pagePath, pathPrefixes } from './pageTree';

const PAGES_PAGE_SIZE = 20;
const PARENT_CANDIDATE_COUNT = 12;
const SLUG_FALLBACK = 'strona';
const BAD_REQUEST = 400;

const inputSchema = z.object({
  title: z.string().trim().min(1, 'VALIDATION.PAGE_TITLE_REQUIRED').max(200),
  slug: slugInputSchema,
  parentId: z.number().int().positive().nullable(),
  kind: z.enum(PAGE_KINDS),
  bodyHtml: richBodySchema.default(''),
  status: z.enum(CONTENT_STATUSES),
  commentsEnabled: z.boolean(),
  tagIds: z.array(z.number().int().positive()).max(30).default([]),
});

type PageInput = z.infer<typeof inputSchema>;

const childCount = sql<number>`(
  SELECT COUNT(*) FROM ${schema.pages} AS children WHERE children.parent_id = ${qualified(schema.pages.id)}
)`;

const pageRowColumns = {
  id: schema.pages.id,
  parentId: schema.pages.parentId,
  title: schema.pages.title,
  path: schema.pages.path,
  kind: schema.pages.kind,
  status: schema.pages.status,
  childCount,
};

const siblingsOf = (parentId: number | null) =>
  parentId === null ? isNull(schema.pages.parentId) : eq(schema.pages.parentId, parentId);

const isReservedRootSlug = (slug: string, parentId: number | null): boolean =>
  parentId === null && (RESERVED_ROOT_SEGMENTS as readonly string[]).includes(slug);

const isSlugTaken = (tx: Tx, slug: string, parentId: number | null, exceptId?: number): boolean =>
  isReservedRootSlug(slug, parentId) ||
  Boolean(
    tx
      .select({ id: schema.pages.id })
      .from(schema.pages)
      .where(
        and(siblingsOf(parentId), eq(schema.pages.slug, slug), exceptId ? ne(schema.pages.id, exceptId) : undefined),
      )
      .get(),
  );

const parentPathOf = (tx: Tx, parentId: number | null): string | null => {
  if (parentId === null) {
    return null;
  }
  const parent = tx.select({ path: schema.pages.path }).from(schema.pages).where(eq(schema.pages.id, parentId)).get();
  if (!parent) {
    throw createError({ statusCode: BAD_REQUEST, statusMessage: 'ERRORS.PARENT_PAGE_NOT_FOUND' });
  }
  return parent.path;
};

const nextSortOrder = (tx: Tx, parentId: number | null): number => {
  const last = tx
    .select({ last: max(schema.pages.sortOrder) })
    .from(schema.pages)
    .where(siblingsOf(parentId))
    .get()?.last;
  return (last ?? -1) + 1;
};

const siblingIdsInOrder = (tx: Tx, parentId: number | null): number[] =>
  tx
    .select({ id: schema.pages.id })
    .from(schema.pages)
    .where(siblingsOf(parentId))
    .orderBy(asc(schema.pages.sortOrder), asc(schema.pages.id))
    .all()
    .map((sibling) => sibling.id);

const storeSiblingOrder = (tx: Tx, orderedIds: number[]) => {
  orderedIds.forEach((id, sortOrder) => {
    tx.update(schema.pages).set({ sortOrder }).where(eq(schema.pages.id, id)).run();
  });
};

const closeSiblingGaps = (tx: Tx, parentId: number | null) => storeSiblingOrder(tx, siblingIdsInOrder(tx, parentId));

const replaceTags = (tx: Tx, pageId: number, tagIds: number[]) => {
  tx.delete(schema.pageTags).where(eq(schema.pageTags.pageId, pageId)).run();
  if (tagIds.length) {
    tx.insert(schema.pageTags)
      .values(tagIds.map((tagId) => ({ pageId, tagId })))
      .onConflictDoNothing()
      .run();
  }
};

const storedValues = (input: PageInput) => ({
  title: input.title,
  parentId: input.parentId,
  kind: input.kind,
  bodyHtml: cleanEditorHtml(input.bodyHtml),
  status: input.status,
  commentsEnabled: input.commentsEnabled,
  updatedAt: new Date(),
});

const createPage = (tx: Tx, input: PageInput) => {
  const parentPath = parentPathOf(tx, input.parentId);
  const slug = adminSlug(
    input.slug,
    input.title,
    (candidate) => isSlugTaken(tx, candidate, input.parentId),
    SLUG_FALLBACK,
  );
  const created = tx
    .insert(schema.pages)
    .values({
      ...storedValues(input),
      slug,
      path: pagePath(parentPath, slug),
      sortOrder: nextSortOrder(tx, input.parentId),
    })
    .returning({ id: schema.pages.id })
    .get();
  replaceTags(tx, created.id, input.tagIds);
  return created;
};

const updatePage = (tx: Tx, id: number, input: PageInput) => {
  const nodes = tx
    .select({ id: schema.pages.id, parentId: schema.pages.parentId, slug: schema.pages.slug })
    .from(schema.pages)
    .all();
  if (isInsideSubtree(nodes, id, input.parentId)) {
    throw conflict('ERRORS.PAGE_PARENT_CYCLE');
  }
  const current = foundOr404(
    tx
      .select({ parentId: schema.pages.parentId, path: schema.pages.path, sortOrder: schema.pages.sortOrder })
      .from(schema.pages)
      .where(eq(schema.pages.id, id))
      .get(),
  );
  const hasNewParent = current.parentId !== input.parentId;
  const slug = adminSlug(
    input.slug,
    input.title,
    (candidate) => isSlugTaken(tx, candidate, input.parentId, id),
    SLUG_FALLBACK,
  );
  const path = pagePath(parentPathOf(tx, input.parentId), slug);
  tx.update(schema.pages)
    .set({
      ...storedValues(input),
      slug,
      path,
      sortOrder: hasNewParent ? nextSortOrder(tx, input.parentId) : current.sortOrder,
    })
    .where(eq(schema.pages.id, id))
    .run();
  if (path !== current.path) {
    descendantPaths(nodes, id, path).forEach((descendant) => {
      tx.update(schema.pages).set({ path: descendant.path }).where(eq(schema.pages.id, descendant.id)).run();
    });
  }
  if (hasNewParent) {
    closeSiblingGaps(tx, current.parentId);
  }
  replaceTags(tx, id, input.tagIds);
};

const removePage = (tx: Tx, id: number) => {
  const page = foundOr404(
    tx.select({ parentId: schema.pages.parentId }).from(schema.pages).where(eq(schema.pages.id, id)).get(),
  );
  const firstChild = tx.select({ id: schema.pages.id }).from(schema.pages).where(eq(schema.pages.parentId, id)).get();
  if (firstChild) {
    throw conflict('ERRORS.PAGE_HAS_CHILDREN');
  }
  tx.delete(schema.comments)
    .where(and(eq(schema.comments.targetKind, 'page'), eq(schema.comments.targetId, id)))
    .run();
  tx.delete(schema.pages).where(eq(schema.pages.id, id)).run();
  closeSiblingGaps(tx, page.parentId);
};

export const pagesResource = defineAdminResource({
  access: 'pages',
  inputSchema,
  list: ({ page, search }) => {
    const db = useDb();
    const where = search ? like(schema.pages.title, `%${search}%`) : undefined;
    const items = db
      .select(pageRowColumns)
      .from(schema.pages)
      .where(where)
      .orderBy(asc(schema.pages.path))
      .limit(PAGES_PAGE_SIZE)
      .offset(pageOffset(page, PAGES_PAGE_SIZE))
      .all();
    const total = db.select({ total: count() }).from(schema.pages).where(where).get()?.total ?? 0;
    return paginated(items, total, page, PAGES_PAGE_SIZE);
  },
  find: (id) => {
    const db = useDb();
    const page = db.select().from(schema.pages).where(eq(schema.pages.id, id)).get();
    if (!page) {
      return undefined;
    }
    const tagIds = db
      .select({ tagId: schema.pageTags.tagId })
      .from(schema.pageTags)
      .where(eq(schema.pageTags.pageId, id))
      .all()
      .map((row) => row.tagId);
    return { ...page, tagIds };
  },
  create: (input) => useDb().transaction((tx) => createPage(tx, input)),
  update: (id, input) => useDb().transaction((tx) => updatePage(tx, id, input)),
  remove: (id) => useDb().transaction((tx) => removePage(tx, id)),
});

export const listPageLevel = (parentId: number | null) => {
  const db = useDb();
  const parent =
    parentId === null
      ? null
      : foundOr404(
          db.select({ path: schema.pages.path }).from(schema.pages).where(eq(schema.pages.id, parentId)).get(),
          'ERRORS.PAGE_NOT_FOUND',
        );
  const breadcrumbs = parent
    ? db
        .select({ id: schema.pages.id, title: schema.pages.title })
        .from(schema.pages)
        .where(inArray(schema.pages.path, pathPrefixes(parent.path)))
        .orderBy(sql`LENGTH(${schema.pages.path})`)
        .all()
    : [];
  const children = db
    .select(pageRowColumns)
    .from(schema.pages)
    .where(siblingsOf(parentId))
    .orderBy(asc(schema.pages.sortOrder), asc(schema.pages.id))
    .all();
  return { breadcrumbs, children };
};

const outsideSubtreeOf = (pageId: number | null) => {
  const subtreeRoot =
    pageId === null
      ? undefined
      : useDb().select({ path: schema.pages.path }).from(schema.pages).where(eq(schema.pages.id, pageId)).get();
  return subtreeRoot
    ? and(ne(schema.pages.path, subtreeRoot.path), notLike(schema.pages.path, `${subtreeRoot.path}/%`))
    : undefined;
};

export const findParentCandidates = (search: string, movedPageId: number | null) =>
  useDb()
    .select({ id: schema.pages.id, title: schema.pages.title, path: schema.pages.path })
    .from(schema.pages)
    .where(and(like(schema.pages.title, `%${search}%`), outsideSubtreeOf(movedPageId)))
    .orderBy(asc(schema.pages.path))
    .limit(PARENT_CANDIDATE_COUNT)
    .all();

export const movePage = (id: number, direction: MoveDirection) => {
  useDb().transaction((tx) => {
    const page = foundOr404(
      tx.select({ parentId: schema.pages.parentId }).from(schema.pages).where(eq(schema.pages.id, id)).get(),
    );
    storeSiblingOrder(tx, movedOrder(siblingIdsInOrder(tx, page.parentId), id, direction));
  });
};
