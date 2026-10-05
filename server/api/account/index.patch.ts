import { z } from 'zod';
import { userNameSchema } from '#shared/utils/users';

const bodySchema = z.object({ name: userNameSchema });

export default defineEventHandler(async (event) => {
  const account = await requireAccount(event);
  const { name } = await readValidatedBody(event, bodySchema.parse);
  const renamed = renameAccount(account.id, name);
  await setUserSession(event, { user: sessionUserOf(renamed) });
  return sessionUserOf(renamed);
});
