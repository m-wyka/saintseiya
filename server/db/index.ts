import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import * as schema from './schema';

const DEFAULT_DB_PATH = '.data/saintseiya.db';

const openDatabase = (path: string) => {
  mkdirSync(dirname(resolve(path)), { recursive: true });
  const sqlite = new Database(path);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('busy_timeout = 5000');
  sqlite.function('lower_unicode', { deterministic: true }, (value) =>
    typeof value === 'string' ? value.toLocaleLowerCase('pl') : value,
  );
  return drizzle(sqlite, { schema });
};

const findMigrationsFolder = () => {
  const candidates = [
    process.env.NUXT_MIGRATIONS_DIR,
    resolve(process.cwd(), 'server/db/migrations'),
    process.argv[1] ? resolve(dirname(process.argv[1]), 'migrations') : undefined,
  ].filter((folder): folder is string => Boolean(folder));
  const found = candidates.find((folder) => existsSync(resolve(folder, 'meta/_journal.json')));
  if (!found) {
    throw new Error(`Migrations folder not found, looked in: ${candidates.join(', ')}`);
  }
  return found;
};

export const createDb = (path: string) => {
  const db = openDatabase(path);
  migrate(db, { migrationsFolder: findMigrationsFolder() });
  return db;
};

let sharedDb: ReturnType<typeof createDb> | null = null;

export const getDb = (path?: string) => {
  sharedDb ??= createDb(path || process.env.NUXT_DB_PATH || DEFAULT_DB_PATH);
  return sharedDb;
};

export { schema };
export type Db = ReturnType<typeof createDb>;
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
