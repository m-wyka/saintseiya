export const AUDIT_ACTIONS = ['create', 'update', 'delete', 'sign_in', 'register'] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_ENTITIES = [
  'news',
  'news_categories',
  'tags',
  'pages',
  'maps',
  'media_images',
  'albums',
  'photos',
  'videos',
  'video_categories',
  'downloads',
  'links',
  'link_categories',
  'faq_items',
  'faq_categories',
  'polls',
  'forum_categories',
  'forums',
  'threads',
  'posts',
  'comments',
  'shouts',
  'users',
  'navigation_sections',
  'navigation_links',
  'settings',
] as const;

export interface AuditChange {
  field: string;
  before: string | null;
  after: string | null;
}

export const auditActionLabelKey = (action: AuditAction): string => `AUDIT.ACTION_${action.toUpperCase()}`;

export const auditEntityLabelKey = (entity: string): string => `AUDIT.ENTITY_${entity.toUpperCase()}`;
