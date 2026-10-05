import { asc, eq, max } from 'drizzle-orm';
import { z } from 'zod';
import { withMovedItem } from '#shared/utils/ordering';
import type { MoveDirection } from '#shared/utils/ordering';

const inputSchema = z.object({
  title: z.string().trim().min(2, 'VALIDATION.TITLE_TOO_SHORT').max(60, 'VALIDATION.TITLE_TOO_LONG'),
});

const orderedSections = () =>
  useDb()
    .select()
    .from(schema.navigationSections)
    .orderBy(asc(schema.navigationSections.sortOrder), asc(schema.navigationSections.id))
    .all();

const sortOrderAfterLast = (): number => {
  const last = useDb()
    .select({ sortOrder: max(schema.navigationSections.sortOrder) })
    .from(schema.navigationSections)
    .get();
  return (last?.sortOrder ?? -1) + 1;
};

export const moveNavigationSection = (id: number, direction: MoveDirection) => {
  const sections = orderedSections();
  const reordered = withMovedItem(
    sections,
    sections.findIndex((section) => section.id === id),
    direction,
  );
  useDb().transaction((tx) => {
    reordered.forEach((section, sortOrder) =>
      tx.update(schema.navigationSections).set({ sortOrder }).where(eq(schema.navigationSections.id, section.id)).run(),
    );
  });
};

export const navigationSectionsResource = defineAdminResource({
  access: 'admin',
  inputSchema,
  translatable: {
    table: schema.navigationSections,
    fields: { title: 'text' },
  },
  list: orderedSections,
  find: (id) => useDb().select().from(schema.navigationSections).where(eq(schema.navigationSections.id, id)).get(),
  create: (input) =>
    useDb()
      .insert(schema.navigationSections)
      .values({ title: input.title, sortOrder: sortOrderAfterLast() })
      .returning({ id: schema.navigationSections.id })
      .get(),
  update: (id, input) => {
    useDb()
      .update(schema.navigationSections)
      .set({ title: input.title })
      .where(eq(schema.navigationSections.id, id))
      .run();
  },
  remove: (id) => {
    useDb().delete(schema.navigationSections).where(eq(schema.navigationSections.id, id)).run();
    pruneTranslations(schema.navigationLinks);
  },
});
