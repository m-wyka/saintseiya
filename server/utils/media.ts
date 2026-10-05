import { resolve, sep } from 'node:path';
import { MEDIA_BASE_URL } from '#shared/utils/routes';

const INLINE_CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
  ico: 'image/x-icon',
};
const DOWNLOAD_CONTENT_TYPE = 'application/octet-stream';

export const mediaContentType = (file: string): string | null =>
  INLINE_CONTENT_TYPES[file.slice(file.lastIndexOf('.') + 1).toLowerCase()] ?? null;

export const mediaDownloadContentType = (): string => DOWNLOAD_CONTENT_TYPE;

const safeDecode = (text: string): string | null => {
  try {
    return decodeURIComponent(text);
  } catch {
    return null;
  }
};

export const resolveMediaFile = (requestPath: string, uploadsDir: string): string | null => {
  const storedPath = safeDecode(requestPath.slice(MEDIA_BASE_URL.length).split('?')[0]!);
  if (storedPath === null || storedPath.includes('\0')) {
    return null;
  }
  const root = resolve(uploadsDir);
  const file = resolve(root, `.${storedPath.startsWith('/') ? storedPath : `/${storedPath}`}`);
  return file.startsWith(root + sep) ? file : null;
};
