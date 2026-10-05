import type { MultiPartData } from 'h3';
import { addDownload, downloadDetailsFrom, downloadsResource } from '../../../admin/directory/downloads';

const DOWNLOADS_FOLDER = 'downloads';

const textFieldsOf = (parts: MultiPartData[]): Record<string, string> =>
  Object.fromEntries(
    parts.filter((part) => part.name && !part.filename).map((part) => [part.name, part.data.toString('utf8')]),
  );

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event, downloadsResource.access);
  const [upload] = await uploadedFilesOf(event);
  const details = downloadDetailsFrom(textFieldsOf((await readMultipartFormData(event)) ?? []));
  const storedFile = await storeUploadedFile(event, upload!, DOWNLOADS_FOLDER);
  setResponseStatus(event, 201);
  return addDownload(details, storedFile);
});
