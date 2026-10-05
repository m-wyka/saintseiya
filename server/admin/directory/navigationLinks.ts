import { asc, eq, max } from 'drizzle-orm';
import { z } from 'zod';
import { withMovedItem } from '#shared/utils/ordering';
import type { MoveDirection } from '#shared/utils/ordering';
import { existingIdSchema, isInternalUrl, isWebUrl } from './inputs';

const sectionExists = (sectionId: number): boolean =>
  Boolean(
    useDb()
      .select({ id: schema.navigationSections.id })
      .from(schema.navigationSections)
      .where(eq(schema.navigationSections.id, sectionId))
      .get(),
  );

const inputSchema = z.object({
  sectionId: existingIdSchema(sectionExists, 'VALIDATION.SECTION_REQUIRED'),
  groupTitle: z
    .string()
    .trim()
    .max(60, 'VALIDATION.GROUP_TITLE_TOO_LONG')
    .nullable()
    .default(null)
    .transform((title) => title || null),
  label: z.string().trim().min(1, 'VALIDATION.LINK_LABEL_REQUIRED').max(80, 'VALIDATION.LINK_LABEL_TOO_LONG'),
  url: z
    .string()
    .trim()
    .max(300, 'VALIDATION.URL_TOO_LONG')
    .refine((url) => isInternalUrl(url) || isWebUrl(url), 'VALIDATION.INTERNAL_OR_WEB_URL_REQUIRED'),
});

export const findNavigationLink = (id: number) =>
  useDb().select().from(schema.navigationLinks).where(eq(schema.navigationLinks.id, id)).get();

const orderedLinksOf = (sectionId: number) =>
  useDb()
    .select()
    .from(schema.navigationLinks)
    .where(eq(schema.navigationLinks.sectionId, sectionId))
    .orderBy(asc(schema.navigationLinks.sortOrder), asc(schema.navigationLinks.id))
    .all();

const sortOrderAfterLastIn = (sectionId: number): number => {
  const last = useDb()
    .select({ sortOrder: max(schema.navigationLinks.sortOrder) })
    .from(schema.navigationLinks)
    .where(eq(schema.navigationLinks.sectionId, sectionId))
    .get();
  return (last?.sortOrder ?? -1) + 1;
};

const sortOrderAfterUpdate = (id: number, sectionId: number): number => {
  const stored = findNavigationLink(id);
  return stored?.sectionId === sectionId ? stored.sortOrder : sortOrderAfterLastIn(sectionId);
};

export const moveNavigationLink = (link: { id: number; sectionId: number }, direction: MoveDirection) => {
  const links = orderedLinksOf(link.sectionId);
  const reordered = withMovedItem(
    links,
    links.findIndex((sibling) => sibling.id === link.id),
    direction,
  );
  useDb().transaction((tx) => {
    reordered.forEach((sibling, sortOrder) =>
      tx.update(schema.navigationLinks).set({ sortOrder }).where(eq(schema.navigationLinks.id, sibling.id)).run(),
    );
  });
};

export const navigationLinksResource = defineAdminResource({
  access: 'admin',
  inputSchema,
  translatable: {
    table: schema.navigationLinks,
    fields: { groupTitle: 'text', label: 'text' },
  },
  list: () =>
    useDb()
      .select()
      .from(schema.navigationLinks)
      .orderBy(
        asc(schema.navigationLinks.sectionId),
        asc(schema.navigationLinks.sortOrder),
        asc(schema.navigationLinks.id),
      )
      .all(),
  find: findNavigationLink,
  create: (input) =>
    useDb()
      .insert(schema.navigationLinks)
      .values({ ...input, sortOrder: sortOrderAfterLastIn(input.sectionId) })
      .returning({ id: schema.navigationLinks.id })
      .get(),
  update: (id, input) => {
    useDb()
      .update(schema.navigationLinks)
      .set({ ...input, sortOrder: sortOrderAfterUpdate(id, input.sectionId) })
      .where(eq(schema.navigationLinks.id, id))
      .run();
  },
  remove: (id) => {
    useDb().delete(schema.navigationLinks).where(eq(schema.navigationLinks.id, id)).run();
  },
});
