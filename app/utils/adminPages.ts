import type { PageKind } from '#shared/utils/content';

export const ADMIN_PAGES_PATH = '/admin/strony';

export const PAGE_KIND_LABELS: Record<PageKind, string> = { article: 'Artykuł', hub: 'Hub' };

export const adminPageLevelPath = (parentId: number | null): string =>
  parentId === null ? ADMIN_PAGES_PATH : `${ADMIN_PAGES_PATH}?parent=${parentId}`;
