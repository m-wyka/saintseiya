export default defineNitroPlugin(() => {
  sessionHooks.hook('fetch', async (session, event) => {
    if (!session.user) {
      return;
    }
    const account = findActiveAccount(session.user.id);
    if (!account) {
      await clearUserSession(event);
      throw createError({ statusCode: 401, statusMessage: 'ERRORS.SESSION_EXPIRED' });
    }
    session.user = sessionUserOf(account);
    await storeSessionUser(event, account);
  });
});
