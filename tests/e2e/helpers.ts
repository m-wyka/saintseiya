import type { Page } from '@playwright/test';
import type { ModeratorPermission, UserRole } from '../../shared/utils/roles';

interface TestAccount {
  name: string;
  role?: UserRole;
  permissions?: ModeratorPermission[];
}

export const signIn = async (page: Page, account: TestAccount) => {
  const response = await page.request.post('/api/auth/e2e-login', {
    data: {
      googleId: `e2e:${account.name}`,
      name: account.name,
      role: account.role ?? 'user',
      permissions: account.permissions ?? [],
    },
  });
  if (!response.ok()) {
    throw new Error(`Test sign-in failed with status ${response.status()}`);
  }
};

export const waitUntilInteractive = (page: Page) =>
  page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');

export const visit = async (page: Page, address: string) => {
  const response = await page.goto(address);
  await waitUntilInteractive(page);
  return response;
};
