import { z } from 'zod';
import { MINIMUM_SEARCH_LENGTH } from '#shared/utils/search';

const querySchema = z.object({ q: z.string().trim().max(100).default('') });

export default defineEventHandler(async (event) => {
  const { q: phrase } = await getValidatedQuery(event, querySchema.parse);
  if (phrase.length >= MINIMUM_SEARCH_LENGTH) {
    assertWithinRateLimit(`search:${getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'}`, SEARCH_RATE_LIMIT);
  }
  return searchSite(phrase, contentLocaleOf(event));
});
