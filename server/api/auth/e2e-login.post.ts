import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { MODERATOR_PERMISSIONS, USER_ROLES } from '#shared/utils/roles';

const bodySchema = z.object({
  googleId: z.string().min(1).max(100),
  name: z.string().min(1).max(60),
  role: z.enum(USER_ROLES).default('user'),
  permissions: z.array(z.enum(MODERATOR_PERMISSIONS)).default([]),
});

export default defineEventHandler(async (event) => {
  if (String(useRuntimeConfig(event).e2eLogin) !== 'true') {
    throw createError({ statusCode: 404, statusMessage: 'Nie znaleziono' });
  }
  const body = await readValidatedBody(event, bodySchema.parse);
  const account = signInWithGoogle(event, { sub: body.googleId, name: body.name });
  const promoted = useDb()
    .update(schema.users)
    .set({ role: body.role, permissions: body.permissions })
    .where(eq(schema.users.id, account.id))
    .returning()
    .get();
  await setUserSession(event, { user: sessionUserOf(promoted), loggedInAt: Date.now() });
  return sessionUserOf(promoted);
});
