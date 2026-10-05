import { copyFile, mkdir, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { LEGACY_MEDIA_FOLDER, routes } from '../../shared/utils/routes';

export interface AssetRegistry {
  storedPath: (legacyPath: string) => string;
  url: (legacyPath: string) => string;
  sourceFile: (legacyPath: string) => string;
  exists: (legacyPath: string) => Promise<boolean>;
  copyReferenced: () => Promise<{ copied: number; missing: string[] }>;
}

const fileExists = async (file: string): Promise<boolean> => {
  try {
    return (await stat(file)).isFile();
  } catch {
    return false;
  }
};

export const createAssetRegistry = (legacyDir: string, uploadsDir: string): AssetRegistry => {
  const referenced = new Set<string>();
  const storedPath = (legacyPath: string) => {
    referenced.add(legacyPath);
    return `${LEGACY_MEDIA_FOLDER}/${legacyPath}`;
  };
  const sourceFile = (legacyPath: string) => join(legacyDir, legacyPath);

  const copyReferenced = async () => {
    const missing: string[] = [];
    let copied = 0;
    for (const legacyPath of [...referenced].sort()) {
      const source = sourceFile(legacyPath);
      if (!(await fileExists(source))) {
        missing.push(legacyPath);
        continue;
      }
      const destination = join(uploadsDir, LEGACY_MEDIA_FOLDER, legacyPath);
      await mkdir(dirname(destination), { recursive: true });
      await copyFile(source, destination);
      copied += 1;
    }
    return { copied, missing };
  };

  return {
    storedPath,
    url: (legacyPath) => routes.media(storedPath(legacyPath)),
    sourceFile,
    exists: (legacyPath) => fileExists(sourceFile(legacyPath)),
    copyReferenced,
  };
};
