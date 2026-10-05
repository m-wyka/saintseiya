import { z } from 'zod';

const bodySchema = z.object({ bodyHtml: richBodySchema });

export default defineEventHandler(async (event) => {
  const account = await requireAccount(event);
  const body = await readValidatedBody(event, bodySchema.parse);
  const id = requiredIdParam(event);
  return audited({ actor: account, table: schema.posts, id }, () =>
    editPost(id, account, cleanUserHtml(body.bodyHtml)),
  );
});
