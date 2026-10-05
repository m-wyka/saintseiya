import { z } from 'zod';

const FOLDERS = ['maps', 'images'] as const;
const querySchema = z.object({ folder: z.enum(FOLDERS).default('images') });

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event, 'staff');
  const { folder } = await getValidatedQuery(event, querySchema.parse);
  const [upload] = await uploadedFilesOf(event);
  setResponseStatus(event, 201);
  return storeUploadedImage(event, upload!, folder);
});
