const TOO_MANY_REQUESTS = 429;
const TRACKED_KEYS_BEFORE_SWEEP = 5000;
const LONGEST_WINDOW_SECONDS = 60;

interface RateLimit {
  attempts: number;
  windowSeconds: number;
  messageKey?: string;
}

const attemptsByKey = new Map<string, number[]>();

export const WRITE_RATE_LIMIT: RateLimit = { attempts: 6, windowSeconds: LONGEST_WINDOW_SECONDS };
export const SEARCH_RATE_LIMIT: RateLimit = {
  attempts: 30,
  windowSeconds: LONGEST_WINDOW_SECONDS,
  messageKey: 'ERRORS.SEARCH_RATE_LIMITED',
};

// Search is limited per address, so without this the map would keep every visitor forever.
const forgetIdleKeys = (now: number) => {
  const idleSince = now - LONGEST_WINDOW_SECONDS * 1000;
  attemptsByKey.forEach((attempts, key) => {
    if ((attempts.at(-1) ?? 0) <= idleSince) {
      attemptsByKey.delete(key);
    }
  });
};

export const assertWithinRateLimit = (key: string, limit: RateLimit = WRITE_RATE_LIMIT, now = Date.now()): void => {
  const windowStart = now - limit.windowSeconds * 1000;
  const recentAttempts = (attemptsByKey.get(key) ?? []).filter((attemptedAt) => attemptedAt > windowStart);
  if (recentAttempts.length >= limit.attempts) {
    attemptsByKey.set(key, recentAttempts);
    throw createError({ statusCode: TOO_MANY_REQUESTS, statusMessage: limit.messageKey ?? 'ERRORS.RATE_LIMITED' });
  }
  if (attemptsByKey.size >= TRACKED_KEYS_BEFORE_SWEEP) {
    forgetIdleKeys(now);
  }
  attemptsByKey.set(key, [...recentAttempts, now]);
};

export const trackedRateLimitKeys = (): number => attemptsByKey.size;

export const resetRateLimits = (): void => attemptsByKey.clear();
