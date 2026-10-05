import type { GoogleProfile } from '../../utils/accounts';

export default defineOAuthGoogleEventHandler({
  config: { scope: ['openid', 'email', 'profile'] },
  async onSuccess(event, { user }: { user: GoogleProfile }) {
    const account = signInWithGoogle(event, user);
    await setUserSession(event, { user: sessionUserOf(account), loggedInAt: Date.now() });
    return sendRedirect(event, '/');
  },
  onError(event, error) {
    console.error('[auth] logowanie przez Google nie powiodło się', error);
    return sendRedirect(event, '/?logowanie=blad');
  },
});
