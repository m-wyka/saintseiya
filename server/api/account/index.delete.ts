export default defineEventHandler(async (event) => {
  const account = await requireAccount(event);
  turnAccountIntoGhost(account.id);
  await clearUserSession(event);
  return { deleted: true };
});
