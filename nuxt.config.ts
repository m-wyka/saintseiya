import { readdirSync } from 'node:fs';
import { cp } from 'node:fs/promises';
import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import { localizePagePath } from './shared/utils/routes';

const SESSION_MAX_AGE_SEC = 30 * 24 * 3600;
const STATIC_IMAGE_CACHE = 'public, max-age=86400, stale-while-revalidate=604800';
// The content security policy is added per page in server/plugins/contentSecurityPolicy.ts.
const SECURITY_HEADERS = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), geolocation=(), microphone=(), payment=(), usb=()',
  'strict-transport-security': 'max-age=31536000',
};

const PAGES_DIR = 'app/pages';
const DEFAULT_LOCALE = 'pl';

const INDEX_FILE_SUFFIX = /(^|\/)index$/;

const pageFiles = readdirSync(PAGES_DIR, { recursive: true, encoding: 'utf8' })
  .filter((file) => file.endsWith('.vue'))
  .map((file) => file.replaceAll('\\', '/').replace(/\.vue$/, ''));

const localizedPages: Record<string, Record<string, `/${string}`>> = Object.fromEntries(
  pageFiles.flatMap((file) => {
    const route = file.replace(INDEX_FILE_SUFFIX, '');
    const paths: Record<string, `/${string}`> = { [DEFAULT_LOCALE]: `/${localizePagePath(route)}`, en: `/${route}` };
    return [file, route].map((key) => [key, paths]);
  }),
);

export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  devtools: { enabled: false },
  modules: ['@pinia/nuxt', 'nuxt-auth-utils', '@nuxt/eslint', '@nuxt/fonts', '@nuxtjs/i18n'],
  css: ['~/assets/css/main.css'],
  eslint: {
    config: {
      stylistic: false,
    },
  },
  fonts: {
    // Families are resolved through the provider list instead of a fixed provider: only that path keeps the
    // fallbacks named here, and those get metric overrides so text holds its line breaks when the web font arrives.
    priority: ['google'],
    families: [
      { name: 'Cinzel', weights: [500, 600, 700], fallbacks: ['Times New Roman', 'Georgia', 'Noto Serif'] },
      { name: 'Inter', weights: [400, 500, 600, 700], fallbacks: ['Arial', 'Segoe UI', 'Roboto'] },
    ],
    defaults: { subsets: ['latin', 'latin-ext'], styles: ['normal'] },
  },
  components: [{ path: '~/components', pathPrefix: false }],
  vite: {
    plugins: [tailwindcss()],
  },
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      htmlAttrs: { lang: 'pl' },
      meta: [{ name: 'theme-color', content: '#000000' }],
    },
  },
  runtimeConfig: {
    dbPath: '.data/saintseiya.db',
    uploadsDir: '.data/uploads',
    session: { password: '', maxAge: SESSION_MAX_AGE_SEC },
    oauth: { google: { clientId: '', clientSecret: '' } },
    turnstileSecretKey: '',
    adminEmails: '',
    e2eLogin: 'false',
    trustedProxyHops: 1,
    public: {
      siteUrl: 'http://localhost:3000',
      siteName: 'Saint Seiya Revolution',
      turnstileSiteKey: '',
    },
  },
  nitro: {
    compressPublicAssets: true,
    typescript: { tsConfig: { include: ['../scripts/**/*.ts', '../tests/**/*.ts'] } },
    hooks: {
      compiled: async (nitro) => {
        await cp(resolve('server/db/migrations'), resolve(nitro.options.output.serverDir, 'migrations'), {
          recursive: true,
        });
      },
    },
  },
  i18n: {
    defaultLocale: DEFAULT_LOCALE,
    strategy: 'prefix_except_default',
    detectBrowserLanguage: false,
    customRoutes: 'config',
    experimental: { typedPages: false },
    pages: localizedPages,
    locales: [
      { code: 'pl', language: 'pl-PL', name: 'Polski', file: 'pl.json' },
      { code: 'en', language: 'en-GB', name: 'English', file: 'en.json' },
    ],
  },
  routeRules: {
    '/**': { headers: SECURITY_HEADERS },
    '/admin/**': { ssr: false },
    '/en/admin/**': { ssr: false },
    '/szukaj': { redirect: '/' },
    '/en/search': { redirect: '/en' },
    '/theme/**': { headers: { 'cache-control': STATIC_IMAGE_CACHE } },
  },
  typescript: { strict: true },
});
