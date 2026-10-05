export const CONTENT_STATUSES = ['draft', 'published'] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const PAGE_KINDS = ['article', 'hub'] as const;
export type PageKind = (typeof PAGE_KINDS)[number];

export const COMMENT_TARGETS = ['news', 'page', 'photo', 'video'] as const;
export type CommentTarget = (typeof COMMENT_TARGETS)[number];

export const MAP_AREA_TARGETS = ['page', 'url', 'content'] as const;
export type MapAreaTarget = (typeof MAP_AREA_TARGETS)[number];

export const EXTERNAL_IMAGE_STATUSES = ['unchecked', 'alive', 'dead'] as const;
export type ExternalImageStatus = (typeof EXTERNAL_IMAGE_STATUSES)[number];

export const GHOST_USER_CAPTION = 'Konto usunięte';
