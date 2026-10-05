import { z } from 'zod';

const querySchema = z.object({ q: z.string().trim().max(100).default('') });

export default defineEventHandler(async (event) => searchSite((await getValidatedQuery(event, querySchema.parse)).q));
