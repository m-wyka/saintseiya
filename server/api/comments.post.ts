import { z } from 'zod';
import { COMMENT_TARGETS } from '#shared/utils/content';

const bodySchema = z.object({
  targetKind: z.enum(COMMENT_TARGETS),
  targetId: z.number().int().positive(),
  bodyHtml: richBodySchema,
  captchaToken: captchaTokenSchema,
});

export default defineEventHandler(async (event) => {
  const account = await requireAccount(event);
  const body = await readValidatedBody(event, bodySchema.parse);
  assertWithinRateLimit(`write:${account.id}`);
  await verifyCaptcha(event, body.captchaToken);
  const comment = createComment(body.targetKind, body.targetId, account, cleanUserHtml(body.bodyHtml));
  setResponseStatus(event, 201);
  return { id: comment.id };
});
