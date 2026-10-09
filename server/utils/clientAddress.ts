import type { H3Event } from 'h3';

const FORWARDED_FOR_HEADER = 'x-forwarded-for';

// Every proxy appends the address it received the request from, so only the last entries were written by proxies
// we run. Anything before them is whatever the client chose to send.
export const forwardedClientAddress = (forwardedFor: string | undefined, trustedProxyHops: number): string | null => {
  if (!forwardedFor || !(trustedProxyHops >= 1)) {
    return null;
  }
  const addresses = forwardedFor
    .split(',')
    .map((address) => address.trim())
    .filter(Boolean);
  return addresses.at(-Math.trunc(trustedProxyHops)) ?? null;
};

export const clientAddressOf = (event: H3Event): string | undefined =>
  forwardedClientAddress(
    getRequestHeader(event, FORWARDED_FOR_HEADER),
    Number(useRuntimeConfig(event).trustedProxyHops),
  ) ?? getRequestIP(event);
