import { and, eq, getTableColumns, getTableName, inArray, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import type { SQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core';
import type { ContentLocale } from '#shared/utils/locales';
import { DEFAULT_LOCALE } from '#shared/utils/locales';
import { schema, useDb } from './db';
import { cleanEditorHtml } from './userContent';
import { qualified } from './sqlHelpers';

type ColumnValue<Column extends SQLiteColumn> = Column['_']['notNull'] extends true
  ? Column['_']['data']
  : Column['_']['data'] | null;

export const localized = <Column extends SQLiteColumn>(
  column: Column,
  locale: ContentLocale,
): Column | SQL<ColumnValue<Column>> => {
  if (locale === DEFAULT_LOCALE) {
    return column;
  }
  const tableName = getTableName(column.table);
  return sql<ColumnValue<Column>>`COALESCE((
    SELECT ${qualified(schema.translations.value)} FROM ${schema.translations}
    WHERE ${qualified(schema.translations.entity)} = ${tableName}
      AND ${qualified(schema.translations.entityId)} = ${sql.identifier(tableName)}.${sql.identifier('id')}
      AND ${qualified(schema.translations.field)} = ${column.name}
      AND ${qualified(schema.translations.locale)} = ${locale}
  ), ${qualified(column)})`;
};

type TranslatableFieldKind = 'text' | 'html';

export interface TranslationSource {
  table: SQLiteTable;
  fields: Record<string, TranslatableFieldKind>;
}

type Row = Record<string, unknown>;

const columnNameOf = (source: TranslationSource, property: string): string => {
  const column = getTableColumns(source.table)[property];
  if (!column) {
    throw new Error(`Table ${getTableName(source.table)} has no translatable column for "${property}"`);
  }
  return column.name;
};

const storedTranslations = (source: TranslationSource, ids: number[], locale: ContentLocale) => {
  if (!ids.length) {
    return [];
  }
  return useDb()
    .select()
    .from(schema.translations)
    .where(
      and(
        eq(schema.translations.entity, getTableName(source.table)),
        inArray(schema.translations.entityId, ids),
        eq(schema.translations.locale, locale),
      ),
    )
    .all();
};

export const withTranslations = <Record extends Row>(
  records: Record[],
  source: TranslationSource,
  locale: ContentLocale,
): Record[] => {
  const ids = records.flatMap((record) => (typeof record.id === 'number' ? [record.id] : []));
  const stored = storedTranslations(source, ids, locale);
  const valueOf = (id: unknown, property: string) =>
    stored.find((row) => row.entityId === id && row.field === columnNameOf(source, property))?.value;
  return records.map((record) => ({
    ...record,
    ...Object.fromEntries(
      Object.keys(source.fields).flatMap((property) => {
        const value = valueOf(record.id, property);
        return value === undefined ? [] : [[property, value]];
      }),
    ),
  }));
};

const translationValue = (rawValue: unknown, kind: TranslatableFieldKind): string => {
  if (typeof rawValue !== 'string') {
    return '';
  }
  return kind === 'html' ? cleanEditorHtml(rawValue) : rawValue.trim();
};

export const storeTranslations = (
  source: TranslationSource,
  id: number,
  input: Row,
  base: Row,
  locale: ContentLocale,
): void => {
  const db = useDb();
  const entity = getTableName(source.table);
  for (const [property, kind] of Object.entries(source.fields)) {
    const field = columnNameOf(source, property);
    const value = translationValue(input[property], kind);
    if (!value || value === base[property]) {
      db.delete(schema.translations)
        .where(
          and(
            eq(schema.translations.entity, entity),
            eq(schema.translations.entityId, id),
            eq(schema.translations.field, field),
            eq(schema.translations.locale, locale),
          ),
        )
        .run();
    } else {
      db.insert(schema.translations)
        .values({ entity, entityId: id, field, locale, value })
        .onConflictDoUpdate({
          target: [
            schema.translations.entity,
            schema.translations.entityId,
            schema.translations.field,
            schema.translations.locale,
          ],
          set: { value },
        })
        .run();
    }
  }
};

export const pruneTranslations = (table: SQLiteTable): void => {
  const entity = getTableName(table);
  useDb().run(
    sql`DELETE FROM ${schema.translations}
      WHERE ${qualified(schema.translations.entity)} = ${entity}
        AND ${qualified(schema.translations.entityId)} NOT IN (SELECT ${sql.identifier('id')} FROM ${table})`,
  );
};

export const baseValuesOf = (base: Row, source: TranslationSource): Row =>
  Object.fromEntries(Object.keys(source.fields).map((property) => [property, base[property]]));
