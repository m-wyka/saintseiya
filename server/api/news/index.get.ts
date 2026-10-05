import { z } from 'zod';

const querySchema = z.object({
  page: pageNumberSchema,
  category: z.string().trim().min(1).max(120).optional(),
  tag: z.string().trim().min(1).max(120).optional(),
});

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, querySchema.parse);
  return listPublishedNews(
    { page: query.page, categorySlug: query.category, tagSlug: query.tag },
    undefined,
    contentLocaleOf(event),
  );
});
