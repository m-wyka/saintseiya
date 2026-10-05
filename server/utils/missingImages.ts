import { eq } from 'drizzle-orm';
import { schema, useDb } from './db';

const IMAGE_TAG_PATTERN = /<img\b[^>]*?\bsrc="([^"]+)"[^>]*>/gi;
const KNOWN_URLS_LIFETIME_MS = 5 * 60 * 1000;
const PLACEHOLDER_TITLE = 'Nie znaleziono zdjęcia';

let missingImageUrls: Set<string> | null = null;
let loadedAt = 0;

const loadMissingImageUrls = (): Set<string> => {
  const rows = useDb()
    .select({ url: schema.externalImages.url })
    .from(schema.externalImages)
    .where(eq(schema.externalImages.status, 'dead'))
    .all();
  return new Set(rows.map((row) => row.url));
};

const knownMissingImageUrls = (now: number): Set<string> => {
  if (!missingImageUrls || now - loadedAt > KNOWN_URLS_LIFETIME_MS) {
    missingImageUrls = loadMissingImageUrls();
    loadedAt = now;
  }
  return missingImageUrls;
};

export const forgetMissingImages = (): void => {
  missingImageUrls = null;
};

const placeholderFor = (escapedUrl: string): string =>
  `<a class="missing-image" href="${escapedUrl}" target="_blank" rel="noopener nofollow"><strong>${PLACEHOLDER_TITLE}</strong><span>${escapedUrl}</span></a>`;

export const markMissingImages = (html: string, now = Date.now()): string => {
  const missing = knownMissingImageUrls(now);
  if (!missing.size || !html.includes('<img')) {
    return html;
  }
  return html.replace(IMAGE_TAG_PATTERN, (tag, escapedUrl: string) =>
    missing.has(escapedUrl.replace(/&amp;/g, '&')) ? placeholderFor(escapedUrl) : tag,
  );
};
