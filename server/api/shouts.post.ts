import { z } from 'zod';

const bodySchema = z.object({ message: shoutMessageSchema, captchaToken: captchaTokenSchema });

export default defineEventHandler(async (event) => {
  const account = await requireAccount(event);
  const body = await readValidatedBody(event, bodySchema.parse);
  assertWithinRateLimit(`write:${account.id}`);
  await verifyCaptcha(event, body.captchaToken);
  const shout = createShout(account, body.message);
  setResponseStatus(event, 201);
  return { id: shout.id };
});
