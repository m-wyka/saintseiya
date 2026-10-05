import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { createDb } from '../../server/db';
import { createAssetRegistry } from './assets';
import { planImport } from './plan';
import { readLegacyData } from './read';
import { createLegacyRewriter } from './rewriter';
import { openLegacySource } from './source';
import { writeImport } from './write';
import type { ImportReport } from './write';

const MISSING_FILES_SHOWN = 15;
const SQLITE_SIDE_FILES = ['', '-wal', '-shm'];

const options = parseArgs({
  options: {
    db: { type: 'string', default: '.data/saintseiya.db' },
    uploads: { type: 'string', default: '.data/uploads' },
    legacy: { type: 'string', default: 'legacy' },
    force: { type: 'boolean', default: false },
  },
}).values;

const printReport = (report: ImportReport) => {
  console.log('\nZaimportowane wiersze:');
  console.table(report.inserted);
  if (Object.keys(report.skipped).length) {
    console.log('Pominięte wiersze (puste zaślepki, brak rodzica lub pliku):');
    console.table(report.skipped);
  }
  console.log(`Skopiowane pliki: ${report.copiedFiles}`);
  console.log(`Zewnętrzne obrazki do sprawdzenia: ${report.externalImages}`);
  const missingFiles = [...new Set(report.missingFiles)];
  console.log(`Brakujące pliki w legacy: ${missingFiles.length}`);
  for (const file of missingFiles.slice(0, MISSING_FILES_SHOWN)) {
    console.log(`  - ${file}`);
  }
};

const run = async () => {
  const dbPath = resolve(options.db);
  const uploadsDir = resolve(options.uploads);
  if (existsSync(dbPath) && !options.force) {
    throw new Error(`Baza ${dbPath} już istnieje. Uruchom z --force, aby ją zastąpić.`);
  }
  SQLITE_SIDE_FILES.forEach((suffix) => rmSync(`${dbPath}${suffix}`, { force: true }));

  const source = await openLegacySource();
  const data = await readLegacyData(source);
  await source.close();

  const plan = planImport(data);
  const assets = createAssetRegistry(resolve(options.legacy), uploadsDir);
  const rewriter = createLegacyRewriter(plan.lookups, assets);
  const db = createDb(dbPath);
  const report = await writeImport(db, uploadsDir, data, plan, rewriter, assets);
  db.$client.close();
  printReport(report);
};

await run();
