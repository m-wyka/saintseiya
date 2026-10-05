import { z } from 'zod';
import { messageKey } from '#shared/utils/messages';

const MAX_TABS = 8;

const bodySchema = z.object({
  tabs: z
    .array(
      z.object({
        title: z.string().trim().min(1, 'VALIDATION.TAB_TITLE_REQUIRED').max(40, 'VALIDATION.TAB_TITLE_TOO_LONG'),
        bodyHtml: richBodySchema,
      }),
    )
    .max(MAX_TABS, messageKey('VALIDATION.TOO_MANY_TABS', { max: MAX_TABS })),
});

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event, 'admin');
  const { tabs } = parseInput(bodySchema, await readBody(event));
  const cleanedTabs = tabs.map((tab) => ({ title: tab.title, bodyHtml: cleanEditorHtml(tab.bodyHtml) }));
  writeSetting('newsCenterTabs', cleanedTabs);
  return cleanedTabs;
});
