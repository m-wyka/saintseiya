import { expect, test } from '@playwright/test';
import { openAccountMenu, starrySky, visit } from './helpers';

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
    await expect(page.getByText('Konto nieaktywne').first()).toBeVisible();
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

  test('the search dialog suggests pages, news and forum posts as links', async ({ page }) => {
    await visit(page, '/');
    await page.getByRole('button', { name: 'Szukaj', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Szukaj' });
    const phrase = dialog.getByLabel('Szukana fraza');

    await expect(phrase).toBeFocused();
    await expect(dialog.getByRole('link', { name: 'Forum' })).toBeVisible();

    await phrase.fill('Shiryu');
    await expect(dialog.getByRole('heading', { name: 'Forum (1)' })).toBeVisible();

    await phrase.fill('zzzqqq');
    await expect(dialog.getByText('Nic nie znaleziono dla „zzzqqq”.')).toBeVisible();

    await phrase.fill('posejdon');
    await expect(dialog.getByRole('heading', { name: 'Podstrony (2)' })).toBeVisible();
    await dialog.getByRole('link').first().click();
    await expect(dialog).toBeHidden();
    await expect(page).not.toHaveURL('/');
  });

  test('the search opens from the keyboard', async ({ page }) => {
    await visit(page, '/');
    const dialog = page.getByRole('dialog', { name: 'Szukaj' });
    const phrase = dialog.getByLabel('Szukana fraza');

    await page.keyboard.press('/');
    await expect(phrase).toBeFocused();
    await page.keyboard.type('lost/canvas');
    await expect(phrase).toHaveValue('lost/canvas');
    await dialog.getByRole('button', { name: 'Zamknij' }).click();
    await expect(dialog).toBeHidden();

    await page.keyboard.press('ControlOrMeta+K');
    await expect(phrase).toBeFocused();
  });

  test('the old search address leads to the home page', async ({ page }) => {
    await visit(page, '/szukaj');
    await expect(page).toHaveURL('/');
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
    await expect(
      page.getByRole('complementary', { name: 'Nawigacja po działach' }).getByRole('link', { name: 'Regulamin' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Wróć na stronę główną' }).click();
    await expect(page).toHaveURL('/');
  });

  test('the English version keeps its language and addresses while browsing', async ({ page }) => {
    await visit(page, '/');
    await openAccountMenu(page, 'Zaloguj');
    await page.getByRole('group', { name: 'Język' }).getByRole('link', { name: 'en' }).click();

    await expect(page).toHaveURL('/en');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-GB');
    const mainMenu = page.getByRole('navigation', { name: 'Main menu' });
    await expect(mainMenu.getByRole('link', { name: 'Home' })).toBeVisible();

    await mainMenu.getByRole('link', { name: 'Forum' }).click();
    await expect(page).toHaveURL('/en/forum');
    await page.locator('a[href^="/en/forum/section/"]').first().click();
    await expect(page).toHaveURL(/\/en\/forum\/section\/[\w-]+$/);

    await mainMenu.getByRole('link', { name: 'Gallery' }).click();
    await expect(page).toHaveURL('/en/gallery');
    await openAccountMenu(page, 'Sign in');
    await page.getByRole('group', { name: 'Language' }).getByRole('link', { name: 'pl' }).click();
    await expect(page).toHaveURL('/galeria');
    await expect(page.locator('html')).toHaveAttribute('lang', 'pl-PL');
  });

  test('the starry sky is painted behind the page and holds still when motion is reduced', async ({ page }) => {
    const paintedPixels = async () => (await starrySky(page)).paintedPixels;

    await page.setViewportSize({ width: 1600, height: 900 });
    await visit(page, '/');
    await expect.poll(paintedPixels).toBeGreaterThan(1000);
    const animated = await starrySky(page);
    expect(animated.liveWidth).toBe(animated.stillWidth);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect.poll(async () => (await starrySky(page)).liveWidth).toBe(0);
    expect(await paintedPixels()).toBeGreaterThan(1000);
  });

  test('visitors cannot open the administration panel', async ({ page }) => {
    await visit(page, '/admin');
    await expect(page).toHaveURL('/');
    expect((await page.request.get('/api/admin/dashboard')).status()).toBe(401);
  });
});
