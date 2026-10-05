import { z } from 'zod';

const querySchema = z.object({ page: pageNumberSchema, category: z.string().trim().min(1).max(120).optional() });

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, querySchema.parse);
  return { categories: listVideoCategories(), videos: listVideos(query.page, query.category) };
});
