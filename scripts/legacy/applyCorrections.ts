import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { createDb } from '../../server/db';
import { applyContentCorrections } from './corrections';

const options = parseArgs({ options: { db: { type: 'string', default: '.data/saintseiya.db' } } }).values;

const dbPath = resolve(options.db);
if (!existsSync(dbPath)) {
  throw new Error(`Nie ma bazy ${dbPath}.`);
}
const db = createDb(dbPath);
const report = applyContentCorrections(db);
db.$client.close();
console.table({ ...report, unknownPagePaths: report.unknownPagePaths.length });
report.unknownPagePaths.forEach((path) => console.log(`  brak podstrony: ${path}`));
