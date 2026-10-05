import { z } from 'zod';

const bodySchema = z.object({ bodyHtml: richBodySchema });

export default defineEventHandler(async (event) => {
  const account = await requireAccount(event);
  const body = await readValidatedBody(event, bodySchema.parse);
  return editPost(requiredIdParam(event), account, cleanUserHtml(body.bodyHtml));
});
