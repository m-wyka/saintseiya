import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';

const MEDIA_CACHE_CONTROL = 'public, max-age=86400, stale-while-revalidate=604800';

export default defineEventHandler((event) => {
  const { uploadsDir } = useRuntimeConfig(event);
  const fileOf = (requestPath: string) => resolveMediaFile(requestPath, uploadsDir);

  return serveStatic(event, {
    indexNames: [],
    getContents: (requestPath) => {
      const file = fileOf(requestPath);
      return file ? createReadStream(file) : undefined;
    },
    getMeta: async (requestPath) => {
      const file = fileOf(requestPath);
      const stats = file ? await stat(file).catch(() => null) : null;
      if (!file || !stats?.isFile()) {
        return undefined;
      }
      const inlineType = mediaContentType(file);
      setResponseHeader(event, 'cache-control', MEDIA_CACHE_CONTROL);
      setResponseHeader(event, 'x-content-type-options', 'nosniff');
      if (!inlineType) {
        setResponseHeader(event, 'content-disposition', 'attachment');
      }
      return { type: inlineType ?? mediaDownloadContentType(), size: stats.size, mtime: stats.mtimeMs };
    },
  });
});
