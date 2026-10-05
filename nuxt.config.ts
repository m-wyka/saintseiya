import { cp } from 'node:fs/promises';
import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';

const SESSION_MAX_AGE_SEC = 30 * 24 * 3600;
const STATIC_IMAGE_CACHE = 'public, max-age=86400, stale-while-revalidate=604800';

export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  devtools: { enabled: false },
  modules: ['@pinia/nuxt', 'nuxt-auth-utils', '@nuxt/eslint', '@nuxt/fonts'],
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
  routeRules: {
    '/admin/**': { ssr: false },
    '/legacy/**': { headers: { 'cache-control': STATIC_IMAGE_CACHE } },
  },
  experimental: { typedPages: true },
  typescript: { strict: true },
});
