import { z } from 'zod';

const bodySchema = z.object({ bodyHtml: richBodySchema, captchaToken: captchaTokenSchema });

export default defineEventHandler(async (event) => {
  const account = await requireAccount(event);
  const threadId = requiredIdParam(event);
  const body = await readValidatedBody(event, bodySchema.parse);
  assertWithinRateLimit(`write:${account.id}`);
  await verifyCaptcha(event, body.captchaToken);
  const created = replyToThread(threadId, account, cleanUserHtml(body.bodyHtml));
  setResponseStatus(event, 201);
  return { ...created, page: postLocation(created.postId, sessionUserOf(account))?.page ?? 1 };
});
