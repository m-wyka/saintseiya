import { devices, expect, test } from '@playwright/test';
import { visit } from './helpers';

test.use({ viewport: devices['iPhone 13'].viewport, hasTouch: true });

test.describe('mobile layout', () => {
  test('the menu drawer opens, navigates and closes', async ({ page }) => {
    await visit(page, '/');
    await expect(page.getByRole('complementary', { name: 'Nawigacja po działach' })).toBeHidden();

    await page.getByRole('button', { name: 'Otwórz menu' }).click();
    const drawer = page.getByRole('dialog', { name: 'Menu' });
    await expect(drawer).toBeVisible();
    await drawer.getByRole('link', { name: 'Regulamin' }).click();

    await expect(page).toHaveURL('/regulamin');
    await expect(drawer).toBeHidden();
    await expect(page.getByText('Zasady portalu.')).toBeVisible();
  });

  test('pages fit the screen without horizontal scrolling', async ({ page }) => {
    for (const address of ['/', '/newsy/saint-seiya-revolution-powraca', '/forum', '/mitologia/grecka']) {
      await visit(page, address);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `horizontal overflow on ${address}`).toBeLessThanOrEqual(0);
    }
  });
});
