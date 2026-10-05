import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { eq } from 'drizzle-orm';
import { createDb, schema } from '../../server/db';
import { inBatches, isImageAlive } from './imageCheck';

const PARALLEL_REQUESTS = 16;
const PROGRESS_STEP = 200;

const options = parseArgs({
  options: {
    db: { type: 'string', default: '.data/saintseiya.db' },
    limit: { type: 'string', default: '0' },
    recheck: { type: 'boolean', default: false },
  },
}).values;

const run = async () => {
  const db = createDb(resolve(options.db));
  const limit = Number(options.limit);
  const candidates = db
    .select({ url: schema.externalImages.url })
    .from(schema.externalImages)
    .where(options.recheck ? undefined : eq(schema.externalImages.status, 'unchecked'))
    .all();
  const urls = (limit > 0 ? candidates.slice(0, limit) : candidates).map((candidate) => candidate.url);
  let checked = 0;
  let alive = 0;

  await inBatches(urls, PARALLEL_REQUESTS, async (url) => {
    const isAlive = await isImageAlive(url);
    db.update(schema.externalImages)
      .set({ status: isAlive ? 'alive' : 'dead', checkedAt: new Date() })
      .where(eq(schema.externalImages.url, url))
      .run();
    checked += 1;
    alive += isAlive ? 1 : 0;
    if (checked % PROGRESS_STEP === 0) {
      console.log(`Sprawdzono ${checked} z ${urls.length}…`);
    }
  });

  db.$client.close();
  console.log(`Sprawdzono obrazków: ${checked}. Działa: ${alive}. Nie działa: ${checked - alive}.`);
};

await run();
