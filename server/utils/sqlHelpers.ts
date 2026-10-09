import { getTableName, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';

export const qualified = (column: SQLiteColumn) =>
  sql`${sql.identifier(getTableName(column.table))}.${sql.identifier(column.name)}`;

export const likePattern = (phrase: string): string => `%${phrase.toLocaleLowerCase('pl').replace(/[\\%_]/g, '\\$&')}%`;

// SQLite folds case for ASCII only, so „Świąt” would not find „świąt” without lowering both sides.
export const containsText = (column: SQLiteColumn | SQL, phrase: string) =>
  sql`lower_unicode(${column}) LIKE ${likePattern(phrase)} ESCAPE '\\'`;

export const equalsText = (column: SQLiteColumn | SQL, phrase: string) =>
  sql`lower_unicode(${column}) = ${phrase.toLocaleLowerCase('pl')}`;
