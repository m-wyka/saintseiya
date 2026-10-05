import { expect, test } from '@playwright/test';
import { visit } from './helpers';

test.describe('public site', () => {
  test('home page shows the header, navigation, news and the news center', async ({ page }) => {
    await visit(page, '/');

    await expect(page.getByRole('img', { name: /Saint Seiya Revolution/ })).toBeVisible();
    await expect(
      page.getByRole('navigation', { name: 'Menu główne' }).getByRole('link', { name: 'Forum' }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Saint Seiya Revolution powraca!' })).toBeVisible();
    await expect(page.getByText('Nowy rozdział mangi już dostępny.')).toBeVisible();
    await expect(page.getByText('Szkic redakcyjny')).toHaveCount(0);
    await expect(page.getByText('Konto usunięte').first()).toBeVisible();
  });

  test('a news opens with its body, a placeholder for a dead image and comments', async ({ page }) => {
    await visit(page, '/newsy');
    await page.getByRole('link', { name: 'Saint Seiya Revolution powraca!' }).click();

    await expect(page).toHaveURL('/newsy/saint-seiya-revolution-powraca');
    await expect(page.getByText('Pełna treść newsa o powrocie.')).toBeVisible();
    await expect(page.getByText('Nie znaleziono zdjęcia')).toBeVisible();
    await expect(page.getByText('Świetna wiadomość!')).toBeVisible();
    await expect(page.getByText('Zaloguj się, aby dodać komentarz.')).toBeVisible();
  });

  test('news can be browsed by category and by tag', async ({ page }) => {
    await visit(page, '/newsy/kategoria/manga');
    await expect(page.getByRole('heading', { level: 1, name: 'Manga' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Saint Seiya Revolution powraca!' })).toBeVisible();

    await visit(page, '/tagi/lost-canvas');
    await expect(page.getByRole('heading', { level: 1, name: 'Lost Canvas' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Saint Seiya Revolution powraca!' })).toBeVisible();
  });

  test('a hub page lists its sub-pages and leads down the tree', async ({ page }) => {
    await visit(page, '/mitologia');
    await page
      .getByRole('link', { name: /Grecka/ })
      .first()
      .click();

    await expect(page).toHaveURL('/mitologia/grecka');
    await expect(page.getByText('Wstęp do mitologii greckiej.')).toBeVisible();
    await page.getByRole('article').getByRole('link', { name: 'Posejdon' }).first().click();

    await expect(page).toHaveURL('/mitologia/grecka/posejdon');
    await expect(page.getByRole('heading', { level: 1, name: 'Posejdon' })).toBeVisible();
    await expect(
      page.getByRole('navigation', { name: 'Ścieżka nawigacji' }).getByRole('link', { name: 'Grecka' }),
    ).toBeVisible();
  });

  test('the forum shows public sections, a thread and hides staff sections', async ({ page }) => {
    await visit(page, '/forum');
    await expect(page.getByRole('link', { name: 'Postacie' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Redakcja' })).toHaveCount(0);

    await page.getByRole('link', { name: 'Postacie' }).click();
    await page.getByRole('link', { name: 'Ulubiony rycerz' }).click();

    await expect(page.getByText('Kto jest waszym ulubionym rycerzem?')).toBeVisible();
    await expect(page.getByText('Dla mnie Shiryu.')).toBeVisible();
    await expect(page.getByText('Zaloguj się, aby odpowiedzieć w tym temacie.')).toBeVisible();

    const staffSection = await page.request.get('/forum/dzial/redakcja');
    expect(staffSection.status()).toBe(404);
  });

  test('the gallery leads from an album to a photo', async ({ page }) => {
    await visit(page, '/galeria');
    await page.getByRole('link', { name: /Tapety/ }).click();
    await page.getByRole('link', { name: 'Złota zbroja' }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Złota zbroja' })).toBeVisible();
    await expect(page.getByRole('img', { name: 'Złota zbroja' })).toBeVisible();
  });

  test('an interactive map opens a content window and links to pages', async ({ page }) => {
    await visit(page, '/mapy/mapa-nieba');
    await page.getByRole('button', { name: 'Wieloryb' }).first().click();

    await expect(page.getByRole('dialog', { name: 'Wieloryb' })).toBeVisible();
    await expect(page.getByText('Gwiazdozbiór Wieloryba (Cetus).')).toBeVisible();
    await page.getByRole('button', { name: 'Zamknij' }).click();
    await expect(page.getByRole('dialog', { name: 'Wieloryb' })).toBeHidden();

    await page.getByRole('link', { name: 'Posejdon' }).last().click();
    await expect(page).toHaveURL('/mitologia/grecka/posejdon');
  });

  test('search finds pages, news and forum posts', async ({ page }) => {
    await visit(page, '/szukaj');
    await page.getByLabel('Szukana fraza').fill('Shiryu');
    await page.getByRole('button', { name: 'Szukaj' }).click();
    await expect(page.getByRole('heading', { name: 'Forum (1)' })).toBeVisible();

    await page.getByLabel('Szukana fraza').fill('posejdon');
    await page.getByRole('button', { name: 'Szukaj' }).click();
    await expect(page.getByRole('heading', { name: 'Podstrony (2)' })).toBeVisible();

    await page.getByLabel('Szukana fraza').fill('zzzqqq');
    await page.getByRole('button', { name: 'Szukaj' }).click();
    await expect(page.getByText('Nic nie znaleziono dla „zzzqqq”.')).toBeVisible();
  });

  test('old addresses redirect to the new content', async ({ page }) => {
    await visit(page, '/viewpage.php?page_id=335');
    await expect(page).toHaveURL('/mitologia/grecka');

    await visit(page, '/news.php?readmore=409');
    await expect(page).toHaveURL('/newsy/saint-seiya-revolution-powraca');

    await visit(page, '/forum/viewthread.php?thread_id=126&pid=1582#post_1582');
    await expect(page).toHaveURL(/\/forum\/temat\/\d+#post-\d+$/);
    await expect(page.getByText('Dla mnie Shiryu.')).toBeVisible();
  });

  test('an unknown address shows the not-found page with a way home', async ({ page }) => {
    const response = await visit(page, '/nie-ma-takiej-strony');

    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Tej strony nie ma w Sanktuarium' })).toBeVisible();
    await page.getByRole('button', { name: 'Wróć na stronę główną' }).click();
    await expect(page).toHaveURL('/');
  });

  test('visitors cannot open the administration panel', async ({ page }) => {
    await visit(page, '/admin');
    await expect(page).toHaveURL('/');
    expect((await page.request.get('/api/admin/dashboard')).status()).toBe(401);
  });
});
