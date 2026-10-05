import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createError,
  getRequestIP,
  getRouterParam,
  getValidatedQuery,
  readBody,
  readMultipartFormData,
  readValidatedBody,
} from 'h3';
import { vi } from 'vitest';

const workspace = mkdtempSync(join(tmpdir(), 'saintseiya-test-'));

export const testRuntimeConfig = {
  dbPath: join(workspace, 'saintseiya.db'),
  uploadsDir: join(workspace, 'uploads'),
  turnstileSecretKey: '',
  adminEmails: 'admin@example.com',
  e2eLogin: 'false',
  public: { siteUrl: 'http://localhost:3000', siteName: 'Saint Seiya Revolution', turnstileSiteKey: '' },
};

const SERVER_UTILITY_MODULES = [
  '../shared/utils/slug',
  '../server/utils/db',
  '../server/utils/sqlHelpers',
  '../server/utils/pagination',
  '../server/utils/params',
  '../server/utils/html',
  '../server/utils/imageProcessing',
  '../server/utils/media',
  '../server/utils/authors',
  '../server/utils/settings',
  '../server/utils/contentLocale',
  '../server/utils/translations',
  '../server/utils/missingImages',
  '../server/utils/viewer',
  '../server/utils/rateLimit',
  '../server/utils/captcha',
  '../server/utils/userContent',
  '../server/utils/accounts',
  '../server/utils/auditLog',
  '../server/utils/adminAccess',
  '../server/utils/adminResource',
  '../server/utils/uploads',
  '../server/utils/mediaUsage',
  '../server/utils/mapImages',
  '../server/utils/news',
  '../server/utils/pages',
  '../server/utils/maps',
  '../server/utils/layout',
  '../server/utils/forum',
  '../server/utils/forumWrites',
  '../server/utils/gallery',
  '../server/utils/videos',
  '../server/utils/directory',
  '../server/utils/faq',
  '../server/utils/polls',
  '../server/utils/shouts',
  '../server/utils/comments',
  '../server/utils/communityWrites',
  '../server/utils/home',
  '../server/utils/dashboard',
  '../server/utils/legacyRedirects',
  '../server/utils/search',
  '../server/utils/profiles',
];

const expose = (values: Record<string, unknown>) => {
  Object.assign(globalThis, values);
};

expose({
  createError,
  getRequestIP,
  getRouterParam,
  getValidatedQuery,
  readBody,
  readMultipartFormData,
  readValidatedBody,
  useRuntimeConfig: () => testRuntimeConfig,
  getUserSession: vi.fn(async () => ({})),
  requireUserSession: vi.fn(),
  replaceUserSession: vi.fn(),
  clearUserSession: vi.fn(),
});

for (const modulePath of SERVER_UTILITY_MODULES) {
  expose(await import(modulePath));
}
