import { randomUUID } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import type { H3Event, MultiPartData } from 'h3';
import sharp from 'sharp';
import { messageKey } from '#shared/utils/messages';
import { THUMBNAILS_MEDIA_FOLDER } from '#shared/utils/routes';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const IMAGE_EXTENSION_BY_FORMAT: Record<string, string> = { jpeg: 'jpg', png: 'png', gif: 'gif', webp: 'webp' };
const DOWNLOAD_EXTENSIONS = new Set(['.zip', '.rar', '.7z', '.pdf', '.doc', '.docx', '.txt', '.srt', '.ass', '.mp3']);
const BAD_REQUEST = 400;

export interface StoredImage {
  image: string;
  thumbnail: string;
  width: number;
  height: number;
}

export interface StoredFile {
  file: string;
  fileSize: number;
}

const invalidUpload = (message: string) => createError({ statusCode: BAD_REQUEST, statusMessage: message });

const uploadsDirOf = (event: H3Event): string => useRuntimeConfig(event).uploadsDir;

const datedFolder = (folder: string): string => `${folder}/${new Date().getFullYear()}`;

const writeStoredFile = async (event: H3Event, storedPath: string, data: Buffer) => {
  const destination = join(uploadsDirOf(event), storedPath);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, data);
  return destination;
};

export const uploadedFilesOf = async (event: H3Event): Promise<MultiPartData[]> => {
  const parts = (await readMultipartFormData(event)) ?? [];
  const files = parts.filter((part) => part.filename && part.data.length > 0);
  if (!files.length) {
    throw invalidUpload('ERRORS.UPLOAD_MISSING');
  }
  return files;
};

export const storeUploadedImage = async (
  event: H3Event,
  upload: MultiPartData,
  folder: string,
): Promise<StoredImage> => {
  if (upload.data.length > MAX_IMAGE_BYTES) {
    throw invalidUpload('ERRORS.IMAGE_TOO_LARGE');
  }
  const metadata = await sharp(upload.data, { animated: true })
    .metadata()
    .catch(() => null);
  const extension = metadata?.format ? IMAGE_EXTENSION_BY_FORMAT[metadata.format] : undefined;
  if (!metadata?.width || !metadata.height || !extension) {
    throw invalidUpload('ERRORS.IMAGE_FORMAT_NOT_ALLOWED');
  }
  const image = `${datedFolder(folder)}/${randomUUID()}.${extension}`;
  const thumbnail = thumbnailPathFor(image, THUMBNAILS_MEDIA_FOLDER);
  const storedFile = await writeStoredFile(event, image, upload.data);
  await writeThumbnail(storedFile, join(uploadsDirOf(event), thumbnail));
  return { image, thumbnail, width: metadata.width, height: metadata.pageHeight ?? metadata.height };
};

export const storeUploadedFile = async (event: H3Event, upload: MultiPartData, folder: string): Promise<StoredFile> => {
  const extension = extname(upload.filename ?? '').toLowerCase();
  if (!DOWNLOAD_EXTENSIONS.has(extension)) {
    throw invalidUpload(
      messageKey('ERRORS.FILE_TYPE_NOT_ALLOWED', { extensions: [...DOWNLOAD_EXTENSIONS].join(', ') }),
    );
  }
  if (upload.data.length > MAX_FILE_BYTES) {
    throw invalidUpload('ERRORS.FILE_TOO_LARGE');
  }
  const file = `${datedFolder(folder)}/${randomUUID()}${extension}`;
  await writeStoredFile(event, file, upload.data);
  return { file, fileSize: upload.data.length };
};

export const removeStoredFiles = async (event: H3Event, storedPaths: (string | null | undefined)[]): Promise<void> => {
  const uploadsDir = uploadsDirOf(event);
  for (const storedPath of storedPaths) {
    const file = storedPath ? resolveMediaFile(`/media/${storedPath}`, uploadsDir) : null;
    if (file) {
      await rm(file, { force: true });
    }
  }
};
