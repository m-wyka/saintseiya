export default defineEventHandler(async (event) => {
  const account = await requireAccount(event);
  await audited({ actor: account, table: schema.users, id: account.id }, () => turnAccountIntoGhost(account.id));
  await clearUserSession(event);
  return { deleted: true };
});
