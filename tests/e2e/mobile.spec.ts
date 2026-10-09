import { devices, expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { signIn, starrySky, visit } from './helpers';

const PUBLIC_ADDRESSES = [
  '/',
  '/newsy',
  '/newsy/saint-seiya-revolution-powraca',
  '/forum',
  '/forum/dzial/postacie',
  '/forum/temat/1',
  '/mitologia',
  '/mitologia/grecka',
  '/galeria',
  '/galeria/tapety',
  '/galeria/zdjecie/1',
  '/video',
  '/mapy',
  '/mapy/mapa-nieba',
  '/linki',
  '/faq',
  '/ankiety',
  '/shoutbox',
  '/pliki',
];
const MEMBER_ADDRESSES = ['/konto', '/forum/dzial/postacie/nowy-temat', '/forum/temat/1', '/shoutbox'];
const PANEL_ADDRESSES = [
  '/admin',
  '/admin/newsy',
  '/admin/newsy/nowy',
  '/admin/strony',
  '/admin/strony/nowy',
  '/admin/mapy',
  '/admin/galeria',
  '/admin/nawigacja',
  '/admin/ustawienia',
  '/admin/uzytkownicy',
  '/admin/forum',
  '/admin/komentarze',
  '/admin/dziennik',
];

const expectToFitTheScreen = async (page: Page, addresses: string[]) => {
  for (const address of addresses) {
    await visit(page, address);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `horizontal overflow on ${address}`).toBeLessThanOrEqual(0);
  }
};

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

  test('the starry sky is painted on a phone but nothing in it moves', async ({ page }) => {
    await visit(page, '/');
    await expect.poll(async () => (await starrySky(page)).paintedPixels).toBeGreaterThan(1000);
    expect((await starrySky(page)).liveWidth).toBe(0);
  });

  test('public pages fit the screen without horizontal scrolling', async ({ page }) => {
    await expectToFitTheScreen(page, PUBLIC_ADDRESSES);
  });

  test('forms of a signed-in member fit the screen', async ({ page }) => {
    await signIn(page, { name: 'Rycerz Z Telefonem' });
    await expectToFitTheScreen(page, MEMBER_ADDRESSES);
  });

  test('the map editor adds an area with a button and lets a finger scroll the image', async ({ page }) => {
    await signIn(page, { name: 'Admin Map Z Telefonem', role: 'admin' });
    await visit(page, '/admin/mapy');
    await page.getByRole('link', { name: 'Mapa Nieba' }).click();
    await page.getByRole('button', { name: 'Dodaj obszar' }).click();
    await expect(page.getByLabel('Etykieta')).toHaveValue('Nowy obszar');

    const canvas = page.getByRole('group', { name: 'Obszary mapy' });
    const addedArea = canvas.getByRole('button', { name: /Nowy obszar/ });
    await expect(addedArea).toBeVisible();
    await expect(canvas).toHaveCSS('touch-action', 'pan-x pan-y');
    await expect(addedArea).toHaveCSS('touch-action', 'none');
  });

  test('the administration panel fits the screen', async ({ page }) => {
    await signIn(page, { name: 'Admin Z Telefonem', role: 'admin' });
    await expectToFitTheScreen(page, PANEL_ADDRESSES);
  });
});
