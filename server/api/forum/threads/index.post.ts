import { z } from 'zod';

const TITLE_MAX_LENGTH = 100;

const bodySchema = z.object({
  forumSlug: z.string().min(1).max(120),
  title: z.string().trim().min(3, 'VALIDATION.TITLE_TOO_SHORT').max(TITLE_MAX_LENGTH, 'VALIDATION.TITLE_TOO_LONG'),
  bodyHtml: richBodySchema,
  captchaToken: captchaTokenSchema,
});

export default defineEventHandler(async (event) => {
  const account = await requireAccount(event);
  const body = await readValidatedBody(event, bodySchema.parse);
  assertWithinRateLimit(`write:${account.id}`);
  await verifyCaptcha(event, body.captchaToken);
  const forum = foundOr404(findForumForWriting(body.forumSlug), 'ERRORS.FORUM_NOT_FOUND');
  const created = createThread(forum, account, body.title, cleanUserHtml(body.bodyHtml));
  setResponseStatus(event, 201);
  return created;
});
