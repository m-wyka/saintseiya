import type { PageKind } from '#shared/utils/content';

export const ADMIN_PAGES_PATH = '/admin/strony';

export const PAGE_KIND_LABEL_KEYS: Record<PageKind, string> = {
  article: 'ADMIN_SHARED.PAGE_KIND_ARTICLE',
  hub: 'ADMIN_SHARED.PAGE_KIND_HUB',
};

export const adminPageLevelPath = (parentId: number | null): string =>
  parentId === null ? ADMIN_PAGES_PATH : `${ADMIN_PAGES_PATH}?parent=${parentId}`;
