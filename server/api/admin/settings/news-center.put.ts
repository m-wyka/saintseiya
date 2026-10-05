import { z } from 'zod';

const MAX_TABS = 8;

const bodySchema = z.object({
  tabs: z
    .array(
      z.object({
        title: z.string().trim().min(1, 'Każda zakładka potrzebuje tytułu').max(40, 'Tytuł zakładki jest za długi'),
        bodyHtml: richBodySchema,
      }),
    )
    .max(MAX_TABS, `Najwyżej ${MAX_TABS} zakładek`),
});

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event, 'admin');
  const { tabs } = parseInput(bodySchema, await readBody(event));
  const cleanedTabs = tabs.map((tab) => ({ title: tab.title, bodyHtml: cleanEditorHtml(tab.bodyHtml) }));
  writeSetting('newsCenterTabs', cleanedTabs);
  return cleanedTabs;
});
