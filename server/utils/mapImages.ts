import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { eq, getTableName } from 'drizzle-orm';
import { THUMBNAILS_MEDIA_FOLDER } from '#shared/utils/routes';
import { schema, useDb } from './db';

export const MAP_IMAGES_FOLDER = 'maps';
// An image uploaded in a form that has not been saved yet belongs to no map; it must survive other saves.
const UNSAVED_UPLOAD_LIFETIME_MS = 24 * 60 * 60 * 1000;

const uploadsDir = (): string => useRuntimeConfig().uploadsDir;

const mapImagesInUse = (): Set<string> => {
  const db = useDb();
  const stored = db.select({ image: schema.maps.image, teaserImage: schema.maps.teaserImage }).from(schema.maps).all();
  const translated = db
    .select({ value: schema.translations.value })
    .from(schema.translations)
    .where(eq(schema.translations.entity, getTableName(schema.maps)))
    .all();
  const values = [...stored.flatMap((map) => [map.image, map.teaserImage]), ...translated.map((row) => row.value)];
  return new Set(values.filter((value) => value?.startsWith(`${MAP_IMAGES_FOLDER}/`)) as string[]);
};

const removeMapImage = (storedPath: string) => {
  rmSync(join(uploadsDir(), storedPath), { force: true });
  rmSync(join(uploadsDir(), thumbnailPathFor(storedPath, THUMBNAILS_MEDIA_FOLDER)), { force: true });
};

const abandonedUploads = (inUse: Set<string>, now: number): string[] => {
  const folder = join(uploadsDir(), MAP_IMAGES_FOLDER);
  if (!existsSync(folder)) {
    return [];
  }
  return readdirSync(folder, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name))
    .filter((file) => now - statSync(file).mtimeMs > UNSAVED_UPLOAD_LIFETIME_MS)
    .map((file) => relative(uploadsDir(), file).split(sep).join('/'))
    .filter((storedPath) => !inUse.has(storedPath));
};

export const cleaningUpMapImages = <Result>(changeMaps: () => Result): Result => {
  const usedBefore = mapImagesInUse();
  const result = changeMaps();
  const usedAfter = mapImagesInUse();
  const released = [...usedBefore].filter((storedPath) => !usedAfter.has(storedPath));
  [...released, ...abandonedUploads(usedAfter, Date.now())].forEach(removeMapImage);
  return result;
};
