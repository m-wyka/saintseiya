import { defineConfig, devices } from '@playwright/test';
import { E2E_DB_PATH, E2E_PORT, E2E_SESSION_PASSWORD, E2E_UPLOADS_DIR } from './tests/e2e/environment';

const baseURL = `http://localhost:${E2E_PORT}`;
const useBuild = process.env.E2E_SERVER === 'build';
const serverCommand = useBuild ? 'node .output/server/index.mjs' : `nuxt dev --port ${E2E_PORT}`;
const localChrome = process.env.CI ? {} : { channel: 'chrome' };

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    locale: 'pl-PL',
    timezoneId: 'Europe/Warsaw',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'], ...localChrome } }],
  webServer: {
    command: `tsx tests/e2e/prepare.ts && ${serverCommand}`,
    url: `${baseURL}/api/health`,
    reuseExistingServer: false,
    timeout: 240_000,
    stdout: 'ignore',
    stderr: 'pipe',
    env: {
      PORT: String(E2E_PORT),
      NUXT_IGNORE_LOCK: '1',
      NUXT_DB_PATH: E2E_DB_PATH,
      NUXT_UPLOADS_DIR: E2E_UPLOADS_DIR,
      NUXT_PUBLIC_SITE_URL: baseURL,
      NUXT_SESSION_PASSWORD: E2E_SESSION_PASSWORD,
      NUXT_E2E_LOGIN: 'true',
    },
  },
});
