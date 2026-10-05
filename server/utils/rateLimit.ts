const TOO_MANY_REQUESTS = 429;

interface RateLimit {
  attempts: number;
  windowSeconds: number;
}

const attemptsByKey = new Map<string, number[]>();

export const WRITE_RATE_LIMIT: RateLimit = { attempts: 6, windowSeconds: 60 };

export const assertWithinRateLimit = (key: string, limit: RateLimit = WRITE_RATE_LIMIT, now = Date.now()): void => {
  const windowStart = now - limit.windowSeconds * 1000;
  const recentAttempts = (attemptsByKey.get(key) ?? []).filter((attemptedAt) => attemptedAt > windowStart);
  if (recentAttempts.length >= limit.attempts) {
    attemptsByKey.set(key, recentAttempts);
    throw createError({ statusCode: TOO_MANY_REQUESTS, statusMessage: 'ERRORS.RATE_LIMITED' });
  }
  attemptsByKey.set(key, [...recentAttempts, now]);
};

export const resetRateLimits = (): void => attemptsByKey.clear();
