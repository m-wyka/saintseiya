import { and, count, desc, eq, getTableColumns, getTableName, like, or } from 'drizzle-orm';
import type { SQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core';
import { AUDIT_ACTIONS } from '#shared/utils/audit';
import type { AuditAction, AuditChange } from '#shared/utils/audit';
import type { ContentLocale } from '#shared/utils/locales';
import { DEFAULT_LOCALE } from '#shared/utils/locales';
import type { Account } from './accounts';
import type { AdminListQuery } from './adminResource';
import { schema, useDb } from './db';
import { htmlToPlainText } from './html';
import { pageOffset, paginated } from './pagination';

const AUDIT_PAGE_SIZE = 50;
const EXCERPT_LENGTH = 400;
const EXCERPT_LEAD = 60;
const LABEL_LENGTH = 120;
const NAMING_FIELDS = ['title', 'name', 'question', 'label'];
const FALLBACK_NAMING_FIELDS = ['bodyHtml', 'image', 'file'];

// Counters change on every visit, and contact data must never be copied into the log.
const UNTRACKED_FIELDS = new Set([
  'id',
  'createdAt',
  'updatedAt',
  'lastSeenAt',
  'viewCount',
  'downloadCount',
  'postCount',
  'threadCount',
  'email',
  'googleId',
  'avatarUrl',
]);

type Row = Record<string, unknown>;
type IdentifiedTable = SQLiteTable & { id: SQLiteColumn };

const rowOf = (value: unknown): Row => (value && typeof value === 'object' ? (value as Row) : {});

const valueText = (value: unknown): string | null => {
  if (value === null || value === undefined || value === '' || (Array.isArray(value) && !value.length)) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
};

const sharedPrefixLength = (first: string, second: string): number => {
  let length = 0;
  while (length < first.length && length < second.length && first[length] === second[length]) {
    length += 1;
  }
  return length;
};

const excerptAround = (text: string | null, changeStart: number): string | null => {
  if (text === null || text.length <= EXCERPT_LENGTH) {
    return text;
  }
  const start = Math.max(0, Math.min(changeStart - EXCERPT_LEAD, text.length - EXCERPT_LENGTH));
  const end = start + EXCERPT_LENGTH;
  return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`;
};

export const describeChanges = (before: unknown, after: unknown): AuditChange[] => {
  const beforeRow = rowOf(before);
  const afterRow = rowOf(after);
  const fields = [...new Set([...Object.keys(beforeRow), ...Object.keys(afterRow)])];
  return fields.flatMap((field) => {
    const beforeText = valueText(beforeRow[field]);
    const afterText = valueText(afterRow[field]);
    if (UNTRACKED_FIELDS.has(field) || beforeText === afterText) {
      return [];
    }
    const changeStart = sharedPrefixLength(beforeText ?? '', afterText ?? '');
    return [{ field, before: excerptAround(beforeText, changeStart), after: excerptAround(afterText, changeStart) }];
  });
};

const labelOf = (row: Row): string | null => {
  const field = [...NAMING_FIELDS, ...FALLBACK_NAMING_FIELDS].find((key) => typeof row[key] === 'string' && row[key]);
  if (!field) {
    return null;
  }
  const text = String(row[field]);
  return (field === 'bodyHtml' ? htmlToPlainText(text) : text).slice(0, LABEL_LENGTH);
};

interface AuditEntry {
  action: AuditAction;
  entity: string;
  entityId?: number | null;
  label?: string;
  before?: unknown;
  after?: unknown;
  locale?: ContentLocale;
}

export const recordAudit = (actor: Account, entry: AuditEntry): void => {
  const changes = describeChanges(entry.before, entry.after);
  if (entry.action === 'update' && !changes.length) {
    return;
  }
  const { locale = DEFAULT_LOCALE } = entry;
  useDb()
    .insert(schema.auditLogs)
    .values({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId ?? null,
      label: entry.label ?? labelOf({ ...rowOf(entry.before), ...rowOf(entry.after) }),
      locale: locale === DEFAULT_LOCALE ? null : locale,
      changes,
    })
    .run();
};

export const auditEntityOf = (resourceName: string): string => resourceName.replaceAll('-', '_');

const storedRow = (table: IdentifiedTable, id: number, locale: ContentLocale): Row | undefined => {
  const db = useDb();
  const row = db.select().from(table).where(eq(table.id, id)).get() as Row | undefined;
  if (!row || locale === DEFAULT_LOCALE) {
    return row;
  }
  const propertyOf = Object.fromEntries(
    Object.entries(getTableColumns(table)).map(([property, column]) => [column.name, property]),
  );
  const translated = db
    .select({ field: schema.translations.field, value: schema.translations.value })
    .from(schema.translations)
    .where(
      and(
        eq(schema.translations.entity, getTableName(table)),
        eq(schema.translations.entityId, id),
        eq(schema.translations.locale, locale),
      ),
    )
    .all();
  return { ...row, ...Object.fromEntries(translated.map(({ field, value }) => [propertyOf[field] ?? field, value])) };
};

interface AuditedRecord {
  actor: Account;
  table: IdentifiedTable;
  id: number;
  locale?: ContentLocale;
}

export const audited = async <Result>(
  { actor, table, id, locale = DEFAULT_LOCALE }: AuditedRecord,
  change: () => Result | Promise<Result>,
): Promise<Result> => {
  const before = storedRow(table, id, locale);
  const result = await change();
  const after = storedRow(table, id, locale);
  recordAudit(actor, {
    action: after ? 'update' : 'delete',
    entity: getTableName(table),
    entityId: id,
    before,
    after,
    locale,
  });
  return result;
};

const isAuditAction = (value: string): value is AuditAction => (AUDIT_ACTIONS as readonly string[]).includes(value);

export const listAuditLog = ({ page, search, filter, entity }: AdminListQuery & { entity: string }) => {
  const db = useDb();
  const where = and(
    search
      ? or(like(schema.auditLogs.actorName, `%${search}%`), like(schema.auditLogs.label, `%${search}%`))
      : undefined,
    isAuditAction(filter) ? eq(schema.auditLogs.action, filter) : undefined,
    entity ? eq(schema.auditLogs.entity, entity) : undefined,
  );
  const items = db
    .select()
    .from(schema.auditLogs)
    .where(where)
    .orderBy(desc(schema.auditLogs.createdAt), desc(schema.auditLogs.id))
    .limit(AUDIT_PAGE_SIZE)
    .offset(pageOffset(page, AUDIT_PAGE_SIZE))
    .all();
  const total = db.select({ total: count() }).from(schema.auditLogs).where(where).get()?.total ?? 0;
  return paginated(items, total, page, AUDIT_PAGE_SIZE);
};
