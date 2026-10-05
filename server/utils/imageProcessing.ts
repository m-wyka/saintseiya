import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import sharp from 'sharp';

const THUMBNAIL_MAX_EDGE = 480;
const THUMBNAIL_QUALITY = 80;
const COMPOSITE_QUALITY = 90;

// libvips keeps files it has read open in its cache; on Windows that blocks deleting them afterwards.
sharp.cache({ files: 0 });

export interface ImageSize {
  width: number;
  height: number;
}

export interface ImagePart extends ImageSize {
  file: string;
  left: number;
  top: number;
}

export const readImageSize = async (file: string): Promise<ImageSize | null> => {
  try {
    const { width, height } = await sharp(file).metadata();
    return width && height ? { width, height } : null;
  } catch {
    return null;
  }
};

export const writeThumbnail = async (sourceFile: string, destinationFile: string): Promise<void> => {
  await mkdir(dirname(destinationFile), { recursive: true });
  await sharp(sourceFile)
    .rotate()
    .resize({ width: THUMBNAIL_MAX_EDGE, height: THUMBNAIL_MAX_EDGE, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: THUMBNAIL_QUALITY })
    .toFile(destinationFile);
};

export const thumbnailPathFor = (storedImagePath: string, thumbnailsFolder: string): string =>
  `${thumbnailsFolder}/${storedImagePath.replace(/\.[^./]+$/, '')}.webp`;

const partLayer = async ({ file, left, top, width, height }: ImagePart) => ({
  input: await sharp(file).resize({ width, height, fit: 'fill' }).png().toBuffer(),
  left,
  top,
});

export const writeCompositeImage = async (
  parts: ImagePart[],
  { width, height }: ImageSize,
  background: string,
  destinationFile: string,
): Promise<ImageSize> => {
  await mkdir(dirname(destinationFile), { recursive: true });
  const layers = await Promise.all(parts.map(partLayer));
  const written = await sharp({ create: { width, height, channels: 3, background } })
    .composite(layers)
    .webp({ quality: COMPOSITE_QUALITY })
    .toFile(destinationFile);
  return { width: written.width, height: written.height };
};
