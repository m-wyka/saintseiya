const REQUEST_TIMEOUT_MS = 8000;
const BROWSER_LIKE_HEADERS = {
  'user-agent': 'Mozilla/5.0 (compatible; SaintSeiyaRevolution-ImageCheck/1.0)',
  accept: 'image/*,*/*;q=0.5',
};

export const isUsableImageResponse = (
  isOk: boolean,
  contentType: string | null,
  requestedUrl: string,
  finalUrl: string,
): boolean => {
  if (!isOk || !contentType?.toLowerCase().startsWith('image/')) {
    return false;
  }
  const requestedHost = new URL(requestedUrl).hostname;
  const finalHost = new URL(finalUrl).hostname;
  const requestedPath = new URL(requestedUrl).pathname;
  const finalPath = new URL(finalUrl).pathname;
  const wasSentToAnotherPicture = finalHost !== requestedHost && finalPath !== requestedPath;
  return !wasSentToAnotherPicture;
};

export const isImageAlive = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, {
      headers: BROWSER_LIKE_HEADERS,
      redirect: 'follow',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    await response.body?.cancel();
    return isUsableImageResponse(response.ok, response.headers.get('content-type'), url, response.url);
  } catch {
    return false;
  }
};

export const inBatches = async <Item>(
  items: Item[],
  batchSize: number,
  handle: (item: Item) => Promise<void>,
): Promise<void> => {
  for (let offset = 0; offset < items.length; offset += batchSize) {
    await Promise.all(items.slice(offset, offset + batchSize).map(handle));
  }
};
