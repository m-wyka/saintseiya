import { createHash } from 'node:crypto';

const TURNSTILE_ORIGIN = 'https://challenges.cloudflare.com';
const YOUTUBE_EMBED_ORIGINS = 'https://www.youtube-nocookie.com https://www.youtube.com';
const INLINE_SCRIPT_PATTERN = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
const NOT_EXECUTED_PATTERN = /\bsrc=|type="application\/(?:ld\+)?json"/i;

export const inlineScriptHashes = (htmlChunks: string[]): string[] => {
  const hashes = new Set<string>();
  for (const chunk of htmlChunks) {
    for (const [, attributes = '', code = ''] of chunk.matchAll(INLINE_SCRIPT_PATTERN)) {
      if (code && !NOT_EXECUTED_PATTERN.test(attributes)) {
        hashes.add(`'sha256-${createHash('sha256').update(code).digest('base64')}'`);
      }
    }
  }
  return [...hashes];
};

export const contentSecurityPolicy = (scriptHashes: string[]): string =>
  [
    "default-src 'self'",
    ["script-src 'self'", TURNSTILE_ORIGIN, ...scriptHashes].join(' '),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https: http:",
    "font-src 'self' data:",
    `frame-src ${YOUTUBE_EMBED_ORIGINS} ${TURNSTILE_ORIGIN}`,
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
