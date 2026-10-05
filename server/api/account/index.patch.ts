import { z } from 'zod';
import { userNameSchema } from '#shared/utils/users';

const bodySchema = z.object({ name: userNameSchema });

export default defineEventHandler(async (event) => {
  const account = await requireAccount(event);
  const { name } = await readValidatedBody(event, bodySchema.parse);
  const renamed = await audited({ actor: account, table: schema.users, id: account.id }, () =>
    renameAccount(account.id, name),
  );
  await storeSessionUser(event, renamed);
  return sessionUserOf(renamed);
});
