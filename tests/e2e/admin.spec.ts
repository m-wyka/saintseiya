import { expect, test } from '@playwright/test';
import { confirmRemoval, openAccountMenu, signIn, visit } from './helpers';

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

    await openAccountMenu(page, 'Admin Tłumaczeń');
    await page.getByRole('group', { name: 'Język' }).getByRole('link', { name: 'en' }).click();
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
    await expect(page.getByText(/^\d+ stron(a|y)? na tym poziomie$/)).toBeVisible();
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

  test('editing a legacy page keeps the centring and colour of its blocks', async ({ page }) => {
    await signIn(page, { name: 'Admin Edytora', role: 'admin' });
    const created = await page.request.post('/api/admin/pages', {
      data: {
        title: 'Kroniki Sanktuarium',
        slug: '',
        parentId: null,
        kind: 'article',
        bodyHtml: [
          '<div style="text-align:center"><img src="/media/photos/tapeta.png" alt="Baner" /></div>',
          '<div style="color:#9b8424">Złoty wstęp<sup>1</sup> i <small>drobny druk</small></div>',
          '<ol> </ol>',
          '<p>Zwykły akapit.</p>',
        ].join(''),
        status: 'published',
        commentsEnabled: true,
        tagIds: [],
      },
    });
    const { id } = (await created.json()) as { id: number };

    await visit(page, `/admin/strony/${id}`);
    await page.getByRole('textbox', { name: 'Treść' }).focus();
    await page.keyboard.press('Control+End');
    await page.keyboard.type(' Dopisek.');
    await page.getByRole('button', { name: 'Zapisz' }).click();
    await expect(page).toHaveURL('/admin/strony');

    const stored = (await (await page.request.get(`/api/admin/pages/${id}`)).json()) as { bodyHtml: string };
    expect(stored.bodyHtml).toMatch(/<p style="text-align:center"><img src="\/media\/photos\/tapeta\.png"/);
    expect(stored.bodyHtml).toMatch(/color:#9b8424[^>]*>Złoty wstęp/);
    expect(stored.bodyHtml).toMatch(/<sup>(<span[^>]*>)?1/);
    expect(stored.bodyHtml).toMatch(/<small>(<span[^>]*>)?drobny druk/);
    expect(stored.bodyHtml).not.toContain('<li>');
    expect(stored.bodyHtml).toContain('Zwykły akapit. Dopisek.');
  });

  test('the editor says why an address from outside YouTube is not inserted as a film', async ({ page }) => {
    await signIn(page, { name: 'Admin Filmów', role: 'admin' });
    await visit(page, '/admin/strony/nowy');
    const editor = page.getByRole('textbox', { name: 'Treść' });
    await editor.click();

    await page.getByRole('button', { name: 'Film z YouTube' }).click();
    await page.getByLabel('Adres filmu na YouTube').fill('https://vimeo.com/76979871');
    await page.getByRole('button', { name: 'Wstaw', exact: true }).click();
    await expect(page.getByText('To nie jest adres filmu z YouTube.')).toBeVisible();
    await expect(editor.locator('iframe')).toHaveCount(0);

    await page.getByLabel('Adres filmu na YouTube').fill('https://www.youtube.com/watch?v=dEY9fXqqaFE');
    await expect(page.getByText('To nie jest adres filmu z YouTube.')).toBeHidden();
    await page.getByRole('button', { name: 'Wstaw', exact: true }).click();
    await expect(editor.locator('iframe')).toHaveCount(1);
  });

  test('the panel guards translations against lost and misplaced work', async ({ page }) => {
    await signIn(page, { name: 'Admin Przekładu', role: 'admin' });
    const created = await page.request.post('/api/admin/news', {
      data: {
        title: 'Zbroja Strzelca',
        slug: '',
        categoryId: null,
        tagIds: [],
        excerptHtml: '',
        bodyHtml: '',
        status: 'published',
        commentsEnabled: true,
        publishedAt: null,
      },
    });
    const { id } = (await created.json()) as { id: number };
    const contentLanguage = page.getByRole('group', { name: 'Język treści' });
    const confirmation = page.getByRole('dialog', { name: 'Potwierdzenie' });

    await visit(page, `/admin/newsy/${id}`);
    await page.getByLabel('Tytuł').fill('Zmieniony tytuł');
    await contentLanguage.getByRole('button', { name: 'en' }).click();
    await expect(confirmation.getByText('niezapisane zmiany przepadną')).toBeVisible();
    await confirmation.getByRole('button', { name: 'Anuluj' }).click();
    await expect(page.getByLabel('Tytuł')).toHaveValue('Zmieniony tytuł');
    await expect(contentLanguage.getByRole('button', { name: 'pl' })).toHaveAttribute('aria-pressed', 'true');

    await contentLanguage.getByRole('button', { name: 'en' }).click();
    await confirmation.getByRole('button', { name: 'Tak' }).click();
    await expect(page.getByText('Edytujesz wersję angielską.')).toBeVisible();
    await expect(page.getByLabel('Tytuł')).toHaveValue('Zbroja Strzelca');
    await page.getByLabel('Tytuł').fill('Sagittarius Cloth');
    await page.getByRole('button', { name: 'Zapisz' }).click();
    await expect(page).toHaveURL('/admin/newsy');
    await visit(page, '/en/news/zbroja-strzelca');
    await expect(page.getByRole('heading', { level: 1, name: 'Sagittarius Cloth' })).toBeVisible();

    await visit(page, `/admin/newsy/${id}`);
    await contentLanguage.getByRole('button', { name: 'en' }).click();
    await expect(page.getByLabel('Tytuł')).toHaveValue('Sagittarius Cloth');
    await page.getByLabel('Tytuł').fill('');
    await page.getByRole('button', { name: 'Zapisz' }).click();
    await expect(page).toHaveURL('/admin/newsy');

    await page.getByRole('link', { name: 'Tagi', exact: true }).click();
    await page.getByRole('button', { name: 'Dodaj tag' }).click();
    await page.getByLabel('Nazwa').fill('Asgard');
    await page.getByRole('button', { name: 'Zapisz' }).click();
    await expect(confirmation.getByText('nowa pozycja zawsze zapisuje się jako polska')).toBeVisible();
    await confirmation.getByRole('button', { name: 'Tak' }).click();
    await expect(page.getByRole('cell', { name: 'asgard', exact: true })).toBeVisible();

    await visit(page, '/en/news/zbroja-strzelca');
    await expect(page.getByRole('heading', { level: 1, name: 'Zbroja Strzelca' })).toBeVisible();
  });

  test('the panel refuses to remove a category with news and to add a tag that exists', async ({ page }) => {
    await signIn(page, { name: 'Admin Porządków', role: 'admin' });
    await visit(page, '/admin/kategorie');
    await confirmRemoval(page.getByRole('row', { name: /Manga/ }), 'tę kategorię');
    await expect(page.getByText('W tej kategorii są newsy.')).toBeVisible();
    await expect(page.getByRole('row', { name: /Manga/ })).toBeVisible();

    await visit(page, '/admin/tagi');
    await page.getByRole('button', { name: 'Dodaj tag' }).click();
    await page.getByLabel('Nazwa').fill('lost canvas');
    await page.getByRole('button', { name: 'Zapisz' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Tag o tej nazwie już istnieje.' })).toBeVisible();
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

  test('an administrator builds the FAQ in two languages', async ({ page }) => {
    await signIn(page, { name: 'Admin FAQ', role: 'admin' });
    await visit(page, '/admin/faq/kategorie');
    await page.getByRole('button', { name: 'Dodaj kategorię' }).click();
    await page.getByLabel('Nazwa').fill('Rejestracja');
    await page.getByRole('button', { name: 'Zapisz' }).click();
    await expect(page.getByRole('cell', { name: 'Rejestracja', exact: true })).toBeVisible();

    await page.getByRole('link', { name: 'Pytania' }).click();
    await expect(page).toHaveURL('/admin/faq');
    await page.getByRole('button', { name: 'Dodaj pytanie' }).click();
    await page.getByLabel('Tytuł').fill('Czy konto jest płatne?');
    await page.getByRole('textbox', { name: 'Opis' }).click();
    await page.keyboard.type('Nie, konto jest darmowe.');
    await page.getByRole('button', { name: 'Zapisz' }).click();
    await expect(page.getByRole('cell', { name: 'Czy konto jest płatne?', exact: true })).toBeVisible();

    await page.getByRole('group', { name: 'Język treści' }).getByRole('button', { name: 'en' }).click();
    await page.getByRole('button', { name: 'Edytuj' }).click();
    await expect(page.getByLabel('Tytuł')).toHaveValue('Czy konto jest płatne?');
    await page.getByLabel('Tytuł').fill('Is the account paid?');
    await page.getByRole('button', { name: 'Zapisz' }).click();
    await expect(page.getByLabel('Tytuł')).toBeHidden();

    await visit(page, '/faq');
    await expect(page.getByRole('heading', { level: 2, name: 'Rejestracja' })).toBeVisible();
    await expect(page.getByText('Nie, konto jest darmowe.')).toBeHidden();
    await page.getByText('Czy konto jest płatne?').click();
    await expect(page.getByText('Nie, konto jest darmowe.')).toBeVisible();

    await visit(page, '/en/faq');
    await expect(page.getByText('Is the account paid?')).toBeVisible();

    await visit(page, '/');
    await page.getByRole('button', { name: 'Szukaj', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Szukaj' });
    await dialog.getByLabel('Szukana fraza').fill('darmowe');
    await expect(dialog.getByRole('heading', { name: 'FAQ (1)' })).toBeVisible();
    await dialog.getByRole('link', { name: 'Czy konto jest płatne?' }).click();
    await expect(page).toHaveURL(/\/faq#pytanie-\d+$/);
    await expect(page.getByRole('group').getByText('Nie, konto jest darmowe.')).toBeVisible();
  });

  test('the change log shows who changed a news and how', async ({ page }) => {
    await signIn(page, { name: 'Admin Dziennika', role: 'admin' });
    await visit(page, '/admin/newsy/nowy');
    await page.getByLabel('Tytuł').fill('Saga Asgardu');
    await page.getByLabel('Status').selectOption('published');
    await page.getByRole('button', { name: 'Zapisz' }).click();
    await expect(page).toHaveURL('/admin/newsy');
    await page.getByRole('link', { name: 'Saga Asgardu' }).click();
    await page.getByLabel('Tytuł').fill('Saga Asgardu wraca');
    await page.getByRole('button', { name: 'Zapisz' }).click();
    await expect(page).toHaveURL('/admin/newsy');

    await visit(page, '/admin/dziennik');
    await expect(page.getByRole('heading', { level: 1, name: 'Dziennik zmian' })).toBeVisible();
    await page.getByPlaceholder('Nick lub nazwa pozycji…').fill('Saga Asgardu');
    await expect(page.getByRole('listitem').filter({ hasText: 'Dodanie' })).toHaveCount(1);
    await expect(page.getByRole('listitem').filter({ hasText: 'Dodanie' })).toContainText('Saga Asgardu');

    await page.getByLabel('Akcja').selectOption('update');
    const change = page.getByRole('listitem').filter({ hasText: 'Saga Asgardu wraca' });
    await expect(change).toContainText('Admin Dziennika');
    await change.locator('summary').click();
    await expect(change.locator('del').filter({ hasText: 'Saga Asgardu' })).toBeVisible();
    await expect(change.locator('ins').filter({ hasText: 'Saga Asgardu wraca' })).toBeVisible();

    await signIn(page, { name: 'Moderator Bez Dziennika', role: 'moderator', permissions: ['news'] });
    expect((await page.request.get('/api/admin/logs')).status()).toBe(403);
    await visit(page, '/admin/dziennik');
    await expect(page).toHaveURL('/admin');
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
    await openAccountMenu(memberPage, 'Awansowany Rycerz');
    await expect(memberPage.getByRole('link', { name: 'Twoje konto' })).toBeVisible();
    await expect(memberPage.getByRole('link', { name: 'Panel administratora' })).toHaveCount(0);

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
    await openAccountMenu(memberPage, 'Awansowany Rycerz');
    await memberPage.getByRole('link', { name: 'Panel administratora' }).click();
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
    await expect(memberPage.getByRole('button', { name: 'Zaloguj' })).toBeVisible();
    await expect(memberPage.getByRole('button', { name: 'Awansowany Rycerz' })).toHaveCount(0);
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
