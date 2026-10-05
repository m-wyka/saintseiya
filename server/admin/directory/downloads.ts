import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import type { StoredFile } from '../../utils/uploads';

const BAD_REQUEST = 400;

const inputSchema = z.object({
  title: z.string().trim().min(2, 'VALIDATION.TITLE_TOO_SHORT').max(200, 'VALIDATION.TITLE_TOO_LONG'),
  description: z.string().trim().max(1000, 'VALIDATION.DESCRIPTION_TOO_LONG').default(''),
});

type DownloadDetails = z.infer<typeof inputSchema>;

export const downloadDetailsFrom = (rawInput: unknown): DownloadDetails => parseInput(inputSchema, rawInput);

export const findDownload = (id: number) =>
  useDb().select().from(schema.downloads).where(eq(schema.downloads.id, id)).get();

export const addDownload = (details: DownloadDetails, storedFile: StoredFile) =>
  useDb()
    .insert(schema.downloads)
    .values({ ...details, ...storedFile })
    .returning({ id: schema.downloads.id })
    .get();

export const downloadsResource = defineAdminResource({
  access: 'downloads',
  inputSchema,
  translatable: {
    table: schema.downloads,
    fields: { title: 'text', description: 'text' },
  },
  list: () =>
    useDb()
      .select({
        id: schema.downloads.id,
        title: schema.downloads.title,
        description: schema.downloads.description,
        file: schema.downloads.file,
        fileSize: schema.downloads.fileSize,
        downloadCount: schema.downloads.downloadCount,
        createdAt: schema.downloads.createdAt,
      })
      .from(schema.downloads)
      .orderBy(desc(schema.downloads.createdAt), desc(schema.downloads.id))
      .all(),
  find: findDownload,
  create: () => {
    throw createError({ statusCode: BAD_REQUEST, statusMessage: 'ERRORS.DOWNLOAD_REQUIRES_UPLOAD' });
  },
  update: (id, input) => {
    useDb().update(schema.downloads).set(input).where(eq(schema.downloads.id, id)).run();
  },
  remove: (id) => {
    useDb().delete(schema.downloads).where(eq(schema.downloads.id, id)).run();
  },
});
