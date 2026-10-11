import { eq, getTableColumns, getTableName } from 'drizzle-orm';
import type { SQLiteTable } from 'drizzle-orm/sqlite-core';
import { schema } from '../../server/db';
import type { Db } from '../../server/db';
import { sanitizedHtmlToText } from '../../server/utils/html';

export const TRANSLATION_LOCALE = 'en';

export type FieldKind = 'text' | 'html';

interface ContentSource {
  table: SQLiteTable;
  // The first field is the one that names the record (title, name, label, question).
  fields: Record<string, FieldKind>;
  hint?: string;
  parent?: { foreignKey: string; table: SQLiteTable; property: string };
  orderBy?: string;
}

// The same fields the panel lets an editor translate, without the per-language image paths.
const CONTENT_SOURCES: ContentSource[] = [
  { table: schema.navigationSections, fields: { title: 'text' } },
  { table: schema.navigationLinks, fields: { label: 'text', groupTitle: 'text' }, hint: 'url' },
  { table: schema.newsCategories, fields: { name: 'text' } },
  { table: schema.tags, fields: { name: 'text' } },
  { table: schema.forumCategories, fields: { name: 'text' } },
  { table: schema.forums, fields: { name: 'text', description: 'text' } },
  { table: schema.faqCategories, fields: { name: 'text' } },
  { table: schema.faqItems, fields: { title: 'text', descriptionHtml: 'html' } },
  { table: schema.linkCategories, fields: { name: 'text' } },
  { table: schema.links, fields: { title: 'text', description: 'text' }, hint: 'url' },
  { table: schema.downloads, fields: { title: 'text', description: 'text' } },
  { table: schema.videoCategories, fields: { name: 'text', description: 'text' } },
  { table: schema.videos, fields: { title: 'text', description: 'text' } },
  { table: schema.albums, fields: { title: 'text', description: 'text' } },
  {
    table: schema.photos,
    fields: { title: 'text', description: 'text' },
    parent: { foreignKey: 'albumId', table: schema.albums, property: 'title' },
  },
  { table: schema.polls, fields: { question: 'text' } },
  {
    table: schema.pollOptions,
    fields: { label: 'text' },
    parent: { foreignKey: 'pollId', table: schema.polls, property: 'question' },
  },
  { table: schema.maps, fields: { title: 'text', description: 'text' } },
  {
    table: schema.mapAreas,
    fields: { label: 'text', contentHtml: 'html' },
    parent: { foreignKey: 'mapId', table: schema.maps, property: 'title' },
  },
  { table: schema.news, fields: { title: 'text', excerptHtml: 'html', bodyHtml: 'html' } },
  { table: schema.pages, fields: { title: 'text', bodyHtml: 'html' }, hint: 'path', orderBy: 'path' },
];

export interface ContentField {
  key: string;
  entity: string;
  entityId: number;
  column: string;
  kind: FieldKind;
  source: string;
  recordName: string;
  nameKey: string;
  hint: string;
  // Fields of one section stay together in the files handed to translators.
  section: string;
}

type Row = Record<string, unknown>;

const WORD_PATTERN = /\p{L}{2,}/u;

export const keyOf = (entity: string, entityId: number, column: string): string => `${entity}:${entityId}:${column}`;

export const plainTextOf = (value: string, kind: FieldKind): string =>
  kind === 'html' ? sanitizedHtmlToText(value) : value.trim();

const textOf = (value: unknown): string => (typeof value === 'string' ? value : '');

const rowsOf = (db: Db, table: SQLiteTable): Row[] => db.select().from(table).all();

const inReadingOrder = (rows: Row[], orderBy: string | undefined): Row[] =>
  orderBy
    ? [...rows].sort((first, second) =>
        textOf(first[orderBy]).localeCompare(textOf(second[orderBy]), 'pl', { numeric: true }),
      )
    : rows;

const SECTION_DEPTH = 2;

const sectionOf = (entity: string, row: Row, orderBy: string | undefined): string =>
  orderBy ? `${entity}/${textOf(row[orderBy]).split('/').slice(0, SECTION_DEPTH).join('/')}` : entity;

const hintReader = (db: Db, source: ContentSource): ((row: Row) => string) => {
  const { hint, parent } = source;
  if (parent) {
    const parentNames = new Map(rowsOf(db, parent.table).map((row) => [row.id, textOf(row[parent.property])]));
    return (row) => `in "${parentNames.get(row[parent.foreignKey]) ?? ''}"`;
  }
  return (row) => (hint ? `${hint}: ${textOf(row[hint])}` : '');
};

const fieldsOf = (db: Db, source: ContentSource): ContentField[] => {
  const entity = getTableName(source.table);
  const columns = getTableColumns(source.table);
  const hintOf = hintReader(db, source);
  const [nameProperty = ''] = Object.keys(source.fields);
  return inReadingOrder(rowsOf(db, source.table), source.orderBy).flatMap((row) =>
    Object.entries(source.fields).flatMap(([property, kind]) => {
      const value = textOf(row[property]);
      const entityId = Number(row.id);
      if (!WORD_PATTERN.test(plainTextOf(value, kind))) {
        return [];
      }
      return {
        key: keyOf(entity, entityId, columns[property]!.name),
        entity,
        entityId,
        column: columns[property]!.name,
        kind,
        source: value,
        recordName: textOf(row[nameProperty]),
        nameKey: keyOf(entity, entityId, columns[nameProperty]!.name),
        hint: hintOf(row),
        section: sectionOf(entity, row, source.orderBy),
      };
    }),
  );
};

export const readContentFields = (db: Db): ContentField[] => CONTENT_SOURCES.flatMap((source) => fieldsOf(db, source));

export const readStoredTranslations = (db: Db): Map<string, string> =>
  new Map(
    db
      .select()
      .from(schema.translations)
      .where(eq(schema.translations.locale, TRANSLATION_LOCALE))
      .all()
      .map((row) => [keyOf(row.entity, row.entityId, row.field), row.value]),
  );
