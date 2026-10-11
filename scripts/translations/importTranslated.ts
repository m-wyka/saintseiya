import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { createDb } from '../../server/db';
import { parseBundle } from './bundle';
import { readContentFields, readStoredTranslations } from './contentFields';
import { storeTranslatedItems } from './importBundles';

const options = parseArgs({
  options: {
    db: { type: 'string', default: '.data/saintseiya.db' },
    from: { type: 'string', default: '.data/translations/translated' },
    overwrite: { type: 'boolean', default: false },
    file: { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
  },
}).values;

const dbPath = resolve(options.db);
const inputDir = resolve(options.from);
if (!existsSync(dbPath)) {
  throw new Error(`Nie ma bazy ${dbPath}.`);
}
if (!existsSync(inputDir)) {
  throw new Error(`Nie ma katalogu ${inputDir}.`);
}

const db = createDb(dbPath);
const acceptedLabel = options['dry-run'] ? 'przyjęte (próba, nic nie zapisano)' : 'zapisane';
const totals = { [acceptedLabel]: 0, 'już były': 0, odrzucone: 0, 'nieznane klucze': 0, 'pliki urwane': 0 };

for (const file of readdirSync(inputDir)
  .filter((name) => name.endsWith('.txt') && (!options.file || name === options.file))
  .sort()) {
  const bundle = parseBundle(readFileSync(join(inputDir, file), 'utf8'));
  const report = storeTranslatedItems(db, bundle.items, { overwrite: options.overwrite, dryRun: options['dry-run'] });
  totals[acceptedLabel]! += report.stored;
  totals['już były'] += report.alreadyTranslated;
  totals.odrzucone += report.rejected.length;
  totals['nieznane klucze'] += report.unknownKeys.length;
  totals['pliki urwane'] += bundle.isComplete ? 0 : 1;
  if (!bundle.isComplete) {
    console.log(`${file}: brak znacznika końca — plik jest urwany`);
  }
  report.rejected.forEach(({ key, reason }) => console.log(`${file}: odrzucone ${key} — ${reason}`));
  report.warnings.forEach(({ key, note }) => console.log(`${file}: do obejrzenia ${key} — ${note}`));
  report.unknownKeys.forEach((key) => console.log(`${file}: nieznany klucz ${key}`));
}

const stored = readStoredTranslations(db);
const stillPending = readContentFields(db).filter((field) => !stored.has(field.key)).length;
db.$client.close();
console.table({ ...totals, 'zostało do przetłumaczenia': stillPending });
