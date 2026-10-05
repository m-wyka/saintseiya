import { expect, test } from '@playwright/test';
import { signIn, visit } from './helpers';

test.describe('administration panel', () => {
  test('the dashboard shows statistics and charts', async ({ page }) => {
    await signIn(page, { name: 'Admin Testowy', role: 'admin' });
    await visit(page, '/admin');

    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('Posty na forum').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Aktywność rok po roku' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Najaktywniejsi na forum' })).toBeVisible();
  });

  test('an administrator publishes a news that appears on the site', async ({ page }) => {
    await signIn(page, { name: 'Admin Newsów', role: 'admin' });
    await visit(page, '/admin/newsy/nowy');

    await page.getByLabel('Tytuł').fill('Nowy sezon Soul of Gold');
    await page.getByRole('textbox', { name: 'Zajawka' }).click();
    await page.keyboard.type('Toei zapowiada kontynuację.');
    await page.getByLabel('Status').selectOption('published');
    await page.getByLabel('Kategoria').selectOption({ label: 'Manga' });
    await page.getByRole('button', { name: 'Lost Canvas' }).click();
    await page.getByRole('button', { name: 'Zapisz' }).click();

    await expect(page).toHaveURL('/admin/newsy');
    await expect(page.getByRole('link', { name: 'Nowy sezon Soul of Gold' })).toBeVisible();

    await visit(page, '/newsy/nowy-sezon-soul-of-gold');
    await expect(page.getByRole('heading', { level: 1, name: 'Nowy sezon Soul of Gold' })).toBeVisible();
    await expect(page.getByText('Toei zapowiada kontynuację.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Lost Canvas' })).toBeVisible();
  });

  test('an administrator translates a news and only the English site shows the translation', async ({ page }) => {
    await signIn(page, { name: 'Admin Tłumaczeń', role: 'admin' });
    await visit(page, '/admin/newsy/nowy');
    await page.getByLabel('Tytuł').fill('Powrót Brązowych Rycerzy');
    await page.getByLabel('Status').selectOption('published');
    await page.getByRole('button', { name: 'Zapisz' }).click();
    await expect(page).toHaveURL('/admin/newsy');

    await page.getByRole('link', { name: 'Powrót Brązowych Rycerzy' }).click();
    await page.getByRole('group', { name: 'Język treści' }).getByRole('button', { name: 'en' }).click();
    await expect(page.getByText('Edytujesz wersję angielską.')).toBeVisible();
    await expect(page.getByLabel('Tytuł')).toHaveValue('Powrót Brązowych Rycerzy');
    await page.getByLabel('Tytuł').fill('Return of the Bronze Saints');
    await page.getByRole('button', { name: 'Zapisz' }).click();
    await expect(page).toHaveURL('/admin/newsy');
    await expect(page.getByRole('link', { name: 'Powrót Brązowych Rycerzy' })).toBeVisible();

    await visit(page, '/en/news/powrot-brazowych-rycerzy');
    await expect(page.getByRole('heading', { level: 1, name: 'Return of the Bronze Saints' })).toBeVisible();
    await visit(page, '/newsy/powrot-brazowych-rycerzy');
    await expect(page.getByRole('heading', { level: 1, name: 'Powrót Brązowych Rycerzy' })).toBeVisible();

    await page.getByRole('navigation', { name: 'Język' }).getByRole('link', { name: 'en' }).click();
    await expect(page).toHaveURL('/en/news/powrot-brazowych-rycerzy');
    await expect(page.getByRole('heading', { level: 1, name: 'Return of the Bronze Saints' })).toBeVisible();
  });

  test('an administrator adds a tag and a sub-page under a hub', async ({ page }) => {
    await signIn(page, { name: 'Admin Treści', role: 'admin' });
    await visit(page, '/admin/tagi');
    await page.getByRole('button', { name: 'Dodaj tag' }).click();
    await page.getByLabel('Nazwa').fill('Złoci Rycerze');
    await page.getByRole('button', { name: 'Zapisz' }).click();
    await expect(page.getByRole('cell', { name: 'zloci-rycerze' })).toBeVisible();

    await visit(page, '/admin/strony');
    await page
      .getByRole('row', { name: /Mitologia/ })
      .getByRole('link', { name: 'Podstrony' })
      .click();
    await page.getByRole('link', { name: 'Dodaj stronę' }).click();
    await page.getByLabel('Tytuł').fill('Rzymska');
    await page.getByRole('textbox', { name: 'Treść' }).click();
    await page.keyboard.type('Bogowie Rzymu i ich greckie odpowiedniki.');
    await page.getByLabel('Status').selectOption('published');
    await page.getByRole('button', { name: 'Zapisz' }).click();

    await visit(page, '/mitologia/rzymska');
    await expect(page.getByRole('heading', { level: 1, name: 'Rzymska' })).toBeVisible();
    await expect(page.getByText('Bogowie Rzymu i ich greckie odpowiedniki.')).toBeVisible();
  });

  test('an administrator draws a map area that leads to an address', async ({ page }) => {
    await signIn(page, { name: 'Admin Map', role: 'admin' });
    await visit(page, '/admin/mapy');
    await page.getByRole('link', { name: 'Mapa Nieba' }).click();

    const canvas = page.getByRole('group', { name: 'Obszary mapy' });
    await canvas.scrollIntoViewIfNeeded();
    const frame = (await canvas.boundingBox())!;
    await page.mouse.move(frame.x + frame.width * 0.72, frame.y + frame.height * 0.12);
    await page.mouse.down();
    await page.mouse.move(frame.x + frame.width * 0.88, frame.y + frame.height * 0.28, { steps: 4 });
    await page.mouse.up();

    await expect(page.getByLabel('Etykieta')).toHaveValue('Nowy obszar');
    await page.getByLabel('Etykieta').fill('Forum rycerzy');
    await page.getByLabel('Dokąd prowadzi').selectOption('url');
    await page.getByLabel('Adres', { exact: true }).fill('/forum');
    await page.getByRole('button', { name: 'Zapisz' }).click();
    await expect(page).toHaveURL('/admin/mapy');

    await visit(page, '/mapy/mapa-nieba');
    await page.getByRole('link', { name: 'Forum rycerzy' }).last().click();
    await expect(page).toHaveURL('/forum');
  });

  test('a moderator sees only the granted sections', async ({ page }) => {
    await signIn(page, { name: 'Moderator Newsów', role: 'moderator', permissions: ['news'] });
    await visit(page, '/admin');

    const panelNavigation = page.getByRole('navigation', { name: 'Panel administratora' });
    await expect(panelNavigation.getByRole('link', { name: 'Newsy' })).toBeVisible();
    await expect(panelNavigation.getByRole('link', { name: 'Użytkownicy' })).toHaveCount(0);
    await expect(panelNavigation.getByRole('link', { name: 'Ustawienia' })).toHaveCount(0);

    await visit(page, '/admin/uzytkownicy');
    await expect(page).toHaveURL('/admin');
    expect((await page.request.get('/api/admin/users')).status()).toBe(403);
  });

  test('a regular user is kept out of the panel', async ({ page }) => {
    await signIn(page, { name: 'Zwykły Rycerz' });
    await visit(page, '/admin/newsy');

    await expect(page).toHaveURL('/');
    expect((await page.request.get('/api/admin/news')).status()).toBe(403);
  });

  test('a role change and a ban reach the signed-in user on the next page load', async ({ page, browser }) => {
    const memberContext = await browser.newContext();
    const memberPage = await memberContext.newPage();
    await signIn(memberPage, { name: 'Awansowany Rycerz' });
    await visit(memberPage, '/');
    await expect(memberPage.getByRole('link', { name: 'Awansowany Rycerz' })).toBeVisible();
    await expect(memberPage.getByRole('link', { name: 'Panel', exact: true })).toHaveCount(0);

    await signIn(page, { name: 'Admin Ról', role: 'admin' });
    await visit(page, '/admin/uzytkownicy');
    await page.getByRole('searchbox', { name: 'Szukaj' }).fill('awansowany');
    const memberRow = page.getByRole('row', { name: /Awansowany Rycerz/ });
    await expect(page.getByRole('row')).toHaveCount(2);
    await memberRow.getByRole('button', { name: 'Rola' }).click();

    const roleForm = page.locator('form').filter({ hasText: 'Rola i uprawnienia: Awansowany Rycerz' });
    await roleForm.getByLabel('Rola', { exact: true }).selectOption('moderator');
    await roleForm.getByText('Newsy, kategorie i tagi').click();
    await roleForm.getByRole('button', { name: 'Zapisz' }).click();
    await expect(page.getByText('Rola zapisana')).toBeVisible();
    await expect(memberRow.getByText('Newsy, kategorie i tagi')).toBeVisible();

    await visit(memberPage, '/');
    await memberPage.getByRole('link', { name: 'Panel', exact: true }).click();
    const panelNavigation = memberPage.getByRole('navigation', { name: 'Panel administratora' });
    await expect(panelNavigation.getByRole('link', { name: 'Newsy' })).toBeVisible();
    await expect(panelNavigation.getByRole('link', { name: 'Użytkownicy' })).toHaveCount(0);

    await memberRow.getByRole('button', { name: 'Zablokuj' }).click();
    await expect(page.getByText('Konto zablokowane').first()).toBeVisible();
    await page.getByRole('searchbox', { name: 'Szukaj' }).fill('');
    await page.getByLabel('Status').selectOption('banned');
    await expect(page.getByRole('row')).toHaveCount(2);
    await expect(memberRow.getByRole('button', { name: 'Odblokuj' })).toBeVisible();

    await visit(memberPage, '/');
    await expect(memberPage.getByRole('link', { name: 'Zaloguj przez Google' })).toBeVisible();
    await expect(memberPage.getByRole('link', { name: 'Awansowany Rycerz' })).toHaveCount(0);
    expect([401, 403]).toContain((await memberPage.request.get('/api/admin/news')).status());

    await memberRow.getByRole('button', { name: 'Odblokuj' }).click();
    await expect(page.getByRole('row')).toHaveCount(1);
    await memberContext.close();
  });

  test('a forum moderator locks a thread so regular users cannot reply', async ({ page, browser }) => {
    await signIn(page, { name: 'Moderator Forum', role: 'moderator', permissions: ['forum'] });
    await visit(page, '/forum/dzial/postacie');
    await page.getByRole('link', { name: 'Ulubiony rycerz' }).click();
    const moderation = page.getByRole('region', { name: 'Moderacja tematu' });
    await moderation.getByRole('button', { name: 'Zamknij' }).click();
    await expect(page.getByText('Temat jest zamknięty — nie można w nim odpowiadać.')).toBeVisible();

    const visitorContext = await browser.newContext();
    const visitorPage = await visitorContext.newPage();
    await signIn(visitorPage, { name: 'Czytelnik Forum' });
    await visit(visitorPage, page.url());
    await expect(visitorPage.getByRole('textbox', { name: 'Treść odpowiedzi' })).toHaveCount(0);
    await visitorContext.close();

    await moderation.getByRole('button', { name: 'Otwórz' }).click();
    await expect(page.getByText('Temat jest zamknięty — nie można w nim odpowiadać.')).toHaveCount(0);
  });
});
