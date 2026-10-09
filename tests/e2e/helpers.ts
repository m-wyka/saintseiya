import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import type { ModeratorPermission, UserRole } from '../../shared/utils/roles';

interface TestAccount {
  name: string;
  role?: UserRole;
  permissions?: ModeratorPermission[];
}

export const signIn = async (page: Page, account: TestAccount): Promise<{ id: number }> => {
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
  return (await response.json()) as { id: number };
};

export const waitUntilInteractive = (page: Page) =>
  page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');

export const openAccountMenu = (page: Page, triggerName: string) =>
  page
    .getByRole('navigation', { name: /^(Menu główne|Main menu)$/ })
    .getByRole('button', { name: triggerName })
    .click();

export const confirmRemoval = async (scope: Locator | Page, subject: string, label = 'Usuń') => {
  const question = `Czy na pewno chcesz usunąć ${subject}?`;
  const page = 'page' in scope ? scope.page() : scope;
  const dialog = page.getByRole('dialog', { name: 'Potwierdzenie' });
  await scope.getByRole('button', { name: label, exact: true }).click();
  await expect(dialog.getByText(question)).toBeVisible();
  await dialog.getByRole('button', { name: 'Tak' }).click();
  await expect(dialog).toBeHidden();
};

export const visit = async (page: Page, address: string) => {
  const response = await page.goto(address);
  await waitUntilInteractive(page);
  return response;
};

export const starrySky = (page: Page) =>
  page.evaluate(() => {
    const [still, live] = [...document.querySelectorAll('canvas')];
    const { data } = still!.getContext('2d')!.getImageData(0, 0, still!.width, still!.height);
    return {
      paintedPixels: data.filter((_, index) => index % 4 === 3).filter((alpha) => alpha > 0).length,
      stillWidth: still!.width,
      liveWidth: live!.width,
    };
  });
