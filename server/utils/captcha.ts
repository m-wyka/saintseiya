import type { H3Event } from 'h3';

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

interface TurnstileVerdict {
  success: boolean;
}

export const verifyCaptcha = async (event: H3Event, token: string | undefined): Promise<void> => {
  const secret = useRuntimeConfig(event).turnstileSecretKey;
  if (!secret) {
    return;
  }
  const verdict = token
    ? await $fetch<TurnstileVerdict>(TURNSTILE_VERIFY_URL, {
        method: 'POST',
        body: { secret, response: token, remoteip: getRequestIP(event, { xForwardedFor: true }) },
      }).catch(() => ({ success: false }))
    : { success: false };
  if (!verdict.success) {
    throw createError({ statusCode: 400, statusMessage: 'Potwierdź, że nie jesteś robotem' });
  }
};
