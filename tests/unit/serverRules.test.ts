import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { forwardedClientAddress } from '../../server/utils/clientAddress';
import { contentSecurityPolicy, inlineScriptHashes } from '../../server/utils/contentSecurityPolicy';
import { mediaContentType, resolveMediaFile } from '../../server/utils/media';
import {
  assertWithinRateLimit,
  resetRateLimits,
  SEARCH_RATE_LIMIT,
  trackedRateLimitKeys,
} from '../../server/utils/rateLimit';
import { cleanUserHtml, shoutToHtml } from '../../server/utils/userContent';
import { canAccess, hasPermission, isStaff } from '../../shared/utils/roles';
import { slugify, uniqueSlug } from '../../shared/utils/slug';
import { fitUserName, userNameKey, userNameSchema } from '../../shared/utils/users';

describe('media files', () => {
  const uploadsDir = '/srv/uploads';

  it('resolves a stored path inside the uploads folder', () => {
    expect(resolveMediaFile('/media/legacy/img/a%20b.jpg', uploadsDir)).toBe(resolve(uploadsDir, 'legacy/img/a b.jpg'));
  });

  it('refuses paths that escape the uploads folder or are malformed', () => {
    expect(resolveMediaFile('/media/../secret.db', uploadsDir)).toBeNull();
    expect(resolveMediaFile('/media/..%2f..%2fetc%2fpasswd', uploadsDir)).toBeNull();
    expect(resolveMediaFile('/media/%E0%A4%A', uploadsDir)).toBeNull();
    expect(resolveMediaFile('/media/a%00.jpg', uploadsDir)).toBeNull();
  });

  it('serves only image types inline', () => {
    expect(mediaContentType('a.JPG')).toBe('image/jpeg');
    expect(mediaContentType('a.webp')).toBe('image/webp');
    expect(mediaContentType('a.svg')).toBeNull();
    expect(mediaContentType('a.html')).toBeNull();
  });
});

describe('rate limit', () => {
  beforeEach(resetRateLimits);

  it('allows a burst up to the limit and then refuses until the window passes', () => {
    const limit = { attempts: 2, windowSeconds: 10 };
    const start = 1_000_000;

    assertWithinRateLimit('user:1', limit, start);
    assertWithinRateLimit('user:1', limit, start + 1000);
    expect(() => assertWithinRateLimit('user:1', limit, start + 2000)).toThrowError('ERRORS.RATE_LIMITED');
    expect(() => assertWithinRateLimit('user:2', limit, start + 2000)).not.toThrow();
    expect(() => assertWithinRateLimit('user:1', limit, start + 11_000)).not.toThrow();
  });

  it('names the search limit in its own message', () => {
    const start = 1_000_000;
    for (let attempt = 0; attempt < SEARCH_RATE_LIMIT.attempts; attempt += 1) {
      assertWithinRateLimit('search:10.0.0.1', SEARCH_RATE_LIMIT, start + attempt);
    }

    expect(() => assertWithinRateLimit('search:10.0.0.1', SEARCH_RATE_LIMIT, start + 1000)).toThrowError(
      'ERRORS.SEARCH_RATE_LIMITED',
    );
    expect(() => assertWithinRateLimit('search:10.0.0.2', SEARCH_RATE_LIMIT, start + 1000)).not.toThrow();
  });

  it('forgets addresses that went quiet once many are tracked', () => {
    const start = 1_000_000;
    for (let visitor = 0; visitor < 5000; visitor += 1) {
      assertWithinRateLimit(`search:${visitor}`, SEARCH_RATE_LIMIT, start);
    }
    expect(trackedRateLimitKeys()).toBe(5000);

    assertWithinRateLimit('search:late', SEARCH_RATE_LIMIT, start + 120_000);
    expect(trackedRateLimitKeys()).toBe(1);
  });
});

describe('client address', () => {
  it('takes the address written by our own proxy, not the one the client sent', () => {
    expect(forwardedClientAddress('203.0.113.7', 1)).toBe('203.0.113.7');
    expect(forwardedClientAddress('10.9.9.9, 203.0.113.7', 1)).toBe('203.0.113.7');
    expect(forwardedClientAddress('10.9.9.9, 203.0.113.7, 198.51.100.2', 2)).toBe('203.0.113.7');
  });

  it('ignores the header without a proxy or when it is shorter than the proxy chain', () => {
    expect(forwardedClientAddress('203.0.113.7', 0)).toBeNull();
    expect(forwardedClientAddress('203.0.113.7', Number.NaN)).toBeNull();
    expect(forwardedClientAddress('203.0.113.7', 2)).toBeNull();
    expect(forwardedClientAddress(undefined, 1)).toBeNull();
    expect(forwardedClientAddress(' , ', 1)).toBeNull();
  });
});

describe('content security policy', () => {
  const hashOf = (code: string) => `'sha256-${createHash('sha256').update(code).digest('base64')}'`;

  it('allows the inline scripts of a page by their hash and skips linked scripts and data blocks', () => {
    const hashes = inlineScriptHashes([
      '<script type="importmap">{"imports":{}}</script><script type="module" src="/_nuxt/entry.js" crossorigin></script>',
      '<script type="application/json" id="__NUXT_DATA__">[1]</script><script>window.__NUXT__={}</script>',
      '<script>window.__NUXT__={}</script>',
    ]);

    expect(hashes).toEqual([hashOf('{"imports":{}}'), hashOf('window.__NUXT__={}')]);
  });

  it('lets scripts run only from the site, the captcha and the listed hashes', () => {
    const policy = contentSecurityPolicy(["'sha256-abc='"]);

    expect(policy).toContain("script-src 'self' https://challenges.cloudflare.com 'sha256-abc='");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy.split('; ').find((directive) => directive.startsWith('script-src'))).not.toContain('unsafe-inline');
  });
});

describe('user content', () => {
  it('cleans markup and keeps only safe links and images', () => {
    const html =
      '<p>Hej <a href="javascript:x">a</a> <a href="/forum">b</a> <img src="data:image/png;base64,AAA"><img src="https://example.com/a.png"></p>';

    expect(cleanUserHtml(html)).toBe(
      '<p>Hej a <a href="/forum">b</a> <img src="https://example.com/a.png" alt="" loading="lazy" /></p>',
    );
  });

  it('refuses content that is empty after cleaning', () => {
    expect(() => cleanUserHtml('<p>   </p><script>alert(1)</script>')).toThrowError('ERRORS.CONTENT_EMPTY');
  });

  it('accepts a post that is only an image', () => {
    expect(cleanUserHtml('<img src="https://example.com/a.png">')).toContain('<img');
  });

  it('escapes shoutbox messages', () => {
    expect(shoutToHtml('a < b & "c"\r\nd')).toBe('a &lt; b &amp; &quot;c&quot;<br />d');
  });

  it('turns text smileys into emoji in posts and shouts', () => {
    expect(cleanUserHtml('<p>Super :) i <strong>tak</strong> ;) :D</p>')).toBe(
      '<p>Super 🙂 i <strong>tak</strong> 😉 😀</p>',
    );
    expect(shoutToHtml('Witajcie :D "rycerze" ;)')).toBe('Witajcie 😀 &quot;rycerze&quot; 😉');
  });

  it('leaves code, addresses, quoted brackets and list markers as they were typed', () => {
    expect(cleanUserHtml('<pre><code>if (a) :) b</code></pre>')).toBe('<pre><code>if (a) :) b</code></pre>');
    expect(cleanUserHtml('<p><a href="https://example.com/:d">godz. 12:00 ("cytat")</a></p>')).toBe(
      '<p><a href="https://example.com/:d" target="_blank" rel="noopener nofollow">godz. 12:00 ("cytat")</a></p>',
    );
    expect(cleanUserHtml('<p>a) Seiya</p><p>b) Shiryu</p>')).toBe('<p>a) Seiya</p><p>b) Shiryu</p>');
  });
});

describe('roles', () => {
  const admin = { role: 'admin' as const, permissions: [] };
  const newsModerator = { role: 'moderator' as const, permissions: ['news' as const] };
  const user = { role: 'user' as const, permissions: ['news' as const] };

  it('gives administrators every permission and moderators only the granted ones', () => {
    expect(hasPermission(admin, 'forum')).toBe(true);
    expect(hasPermission(newsModerator, 'news')).toBe(true);
    expect(hasPermission(newsModerator, 'forum')).toBe(false);
    expect(hasPermission(user, 'news')).toBe(false);
    expect(hasPermission(null, 'news')).toBe(false);
  });

  it('separates staff, permission and administrator access', () => {
    expect(isStaff(newsModerator)).toBe(true);
    expect(isStaff(user)).toBe(false);
    expect(canAccess(newsModerator, 'staff')).toBe(true);
    expect(canAccess(newsModerator, 'admin')).toBe(false);
    expect(canAccess(admin, 'admin')).toBe(true);
    expect(canAccess(null, 'staff')).toBe(false);
  });
});

describe('slugs and nicks', () => {
  it('builds addresses from Polish text', () => {
    expect(slugify('Żółć i Gęślą Jaźń — Ωmega!')).toBe('zolc-i-gesla-jazn-mega');
    expect(slugify('  ---  ')).toBe('');
  });

  it('appends a number until the address is free', () => {
    const taken = new Set(['zeus', 'zeus-2']);
    expect(uniqueSlug('Zeus', (candidate) => taken.has(candidate))).toBe('zeus-3');
    expect(uniqueSlug('!!!', () => false, 'strona')).toBe('strona');
  });

  it('validates and normalises nicks', () => {
    expect(userNameSchema.parse('  Złoty   Rycerz ')).toBe('Złoty Rycerz');
    expect(userNameSchema.safeParse('ab').success).toBe(false);
    expect(userNameSchema.safeParse('<script>').success).toBe(false);
    expect(userNameKey(' ZŁOTY  rycerz')).toBe('złoty rycerz');
    expect(fitUserName('Jan <b>Kowalski</b>', 'Rycerz')).toBe('Jan bKowalskib');
    expect(fitUserName('?', 'Rycerz')).toBe('Rycerz');
  });
});
