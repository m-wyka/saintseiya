import { readdirSync } from 'node:fs';
import { cp } from 'node:fs/promises';
import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import { localizePagePath } from './shared/utils/routes';

const SESSION_MAX_AGE_SEC = 30 * 24 * 3600;
const STATIC_IMAGE_CACHE = 'public, max-age=86400, stale-while-revalidate=604800';

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
    families: [
      { name: 'Cinzel', provider: 'google', weights: [500, 600, 700] },
      { name: 'Inter', provider: 'google', weights: [400, 500, 600, 700] },
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
    baseUrl: process.env.NUXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
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
    '/admin/**': { ssr: false },
    '/en/admin/**': { ssr: false },
    '/szukaj': { redirect: '/' },
    '/en/search': { redirect: '/en' },
    '/legacy/**': { headers: { 'cache-control': STATIC_IMAGE_CACHE } },
  },
  typescript: { strict: true },
});
