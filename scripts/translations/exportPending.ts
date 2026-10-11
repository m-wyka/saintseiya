import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { createDb } from '../../server/db';
import { readContentFields, readStoredTranslations } from './contentFields';
import { planBundles } from './exportBundles';

const options = parseArgs({
  options: {
    db: { type: 'string', default: '.data/saintseiya.db' },
    out: { type: 'string', default: '.data/translations/pending' },
    'max-chars': { type: 'string', default: '30000' },
  },
}).values;

const dbPath = resolve(options.db);
if (!existsSync(dbPath)) {
  throw new Error(`Nie ma bazy ${dbPath}.`);
}
const db = createDb(dbPath);
const fields = readContentFields(db);
const stored = readStoredTranslations(db);
db.$client.close();

const outputDir = resolve(options.out);
mkdirSync(outputDir, { recursive: true });
readdirSync(outputDir)
  .filter((file) => file.endsWith('.txt'))
  .forEach((file) => rmSync(join(outputDir, file)));

const bundles = planBundles(fields, stored, Number(options['max-chars']));
bundles.forEach((bundle) => writeFileSync(join(outputDir, bundle.name), bundle.content));

const pending = fields.filter((field) => !stored.has(field.key));
console.table({
  'pola z tekstem': fields.length,
  'już przetłumaczone': fields.length - pending.length,
  'do przetłumaczenia': pending.length,
  'znaków do przetłumaczenia': pending.reduce((sum, field) => sum + field.source.length, 0),
  plików: bundles.length,
});
console.log(`Pliki do tłumaczenia: ${outputDir}`);
