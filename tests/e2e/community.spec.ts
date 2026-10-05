import { expect, test } from '@playwright/test';
import { openAccountMenu, signIn, visit } from './helpers';

test.describe('signed-in community features', () => {
  test('a user replies in a thread with formatted text', async ({ page }) => {
    await signIn(page, { name: 'Seiya Testowy' });
    await visit(page, '/forum/dzial/postacie');
    await page.getByRole('link', { name: 'Ulubiony rycerz' }).click();

    const editor = page.getByRole('textbox', { name: 'Treść odpowiedzi' });
    await editor.click();
    await page.keyboard.type('Zdecydowanie ');
    await page.getByRole('button', { name: 'Pogrubienie' }).click();
    await page.keyboard.type('Ikki');
    await page.getByRole('button', { name: 'Wyślij odpowiedź' }).click();

    const reply = page.getByRole('article').filter({ hasText: 'Zdecydowanie Ikki' });
    await expect(reply).toBeVisible();
    await expect(reply.locator('strong', { hasText: 'Ikki' })).toBeVisible();
    await expect(reply.getByText('Seiya Testowy')).toBeVisible();
    await expect(editor).toHaveText('');
  });

  test('a user starts a new thread', async ({ page }) => {
    await signIn(page, { name: 'Shun Testowy' });
    await visit(page, '/forum/dzial/postacie');
    await page.getByRole('link', { name: 'Nowy temat' }).click();

    await page.getByLabel('Tytuł tematu').fill('Najlepsza zbroja');
    await page.getByRole('textbox', { name: 'Treść pierwszego posta' }).click();
    await page.keyboard.type('Zbroja Feniksa nie ma sobie równych.');
    await page.getByRole('button', { name: 'Załóż temat' }).click();

    await expect(page).toHaveURL(/\/forum\/temat\/\d+$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Najlepsza zbroja' })).toBeVisible();
    await expect(page.getByText('Zbroja Feniksa nie ma sobie równych.')).toBeVisible();
  });

  test('a user comments on a news', async ({ page }) => {
    await signIn(page, { name: 'Hyoga Testowy' });
    await visit(page, '/newsy/saint-seiya-revolution-powraca');

    await page.getByRole('textbox', { name: 'Treść komentarza' }).click();
    await page.keyboard.type('Nareszcie wracacie!');
    await page.getByRole('button', { name: 'Dodaj komentarz' }).click();

    await expect(page.getByText('Komentarz dodany')).toBeVisible();
    await expect(
      page.getByRole('listitem').filter({ hasText: 'Nareszcie wracacie!' }).getByText('Hyoga Testowy'),
    ).toBeVisible();
  });

  test('a user writes in the shoutbox and votes in a poll once', async ({ page }) => {
    await signIn(page, { name: 'Ikki Testowy' });
    await visit(page, '/shoutbox');
    await page.getByLabel('Twoja wiadomość').fill('Cześć wszystkim <b>rycerzom</b>');
    await page.getByRole('button', { name: 'Wyślij' }).click();
    await expect(page.getByText('Cześć wszystkim <b>rycerzom</b>')).toBeVisible();

    await visit(page, '/ankiety');
    const poll = page.getByRole('article').filter({ hasText: 'Która seria jest najlepsza?' });
    await expect(poll.getByText('4 głosy')).toBeVisible();
    await poll.getByRole('button', { name: 'Głosuję' }).last().click();
    await expect(poll.getByText('5 głosów')).toBeVisible();
    await expect(poll.getByRole('button', { name: 'Głosuję' })).toHaveCount(0);
  });

  test('a user changes the nick and a taken nick is refused', async ({ page }) => {
    await signIn(page, { name: 'Shiryu Testowy' });
    await visit(page, '/konto');

    await page.getByLabel('Nick widoczny na stronie').fill('Hekate');
    await page.getByRole('button', { name: 'Zapisz nick' }).click();
    await expect(page.getByText('Ten nick jest już zajęty')).toBeVisible();

    await page.getByLabel('Nick widoczny na stronie').fill('Smok Shiryu');
    await page.getByRole('button', { name: 'Zapisz nick' }).click();
    await expect(page.getByText('Nick zmieniony')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Smok Shiryu' })).toBeVisible();
  });

  test('signing out returns to the visitor view', async ({ page }) => {
    await signIn(page, { name: 'Gość Testowy' });
    await visit(page, '/');
    await openAccountMenu(page, 'Gość Testowy');
    await page.getByRole('link', { name: 'Profil' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Gość Testowy' })).toBeVisible();

    await openAccountMenu(page, 'Gość Testowy');
    await page.getByRole('button', { name: 'Wyloguj' }).click();
    await expect(page).toHaveURL('/');
    await openAccountMenu(page, 'Zaloguj');
    await expect(page.getByRole('link', { name: 'Zaloguj przez Google' })).toBeVisible();
  });
});
