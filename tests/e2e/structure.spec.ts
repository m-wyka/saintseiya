import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { confirmRemoval, openAccountMenu, signIn, visit } from './helpers';

const addPage = async (page: Page, title: string, kind: 'article' | 'hub' = 'article') => {
  await page.getByRole('link', { name: 'Dodaj stronę' }).click();
  await page.getByLabel('Tytuł').fill(title);
  await page.getByLabel('Typ strony').selectOption(kind);
  await page.getByLabel('Status').selectOption('published');
  await page.getByRole('button', { name: 'Zapisz' }).click();
  await expect(page.getByRole('row', { name: new RegExp(title) })).toBeVisible();
};

const refusalOf = async (response: { json: () => Promise<unknown> }) =>
  ((await response.json()) as { statusMessage: string }).statusMessage;

test.describe('page tree, forum structure and account roles in the panel', () => {
  test('an administrator reorders sub-pages, moves one to another parent and removes them', async ({ page }) => {
    await signIn(page, { name: 'Admin Drzewa', role: 'admin' });
    await visit(page, '/admin/strony');
    await addPage(page, 'Kosmologia', 'hub');
    const hubRow = page.getByRole('row', { name: /Kosmologia/ });
    await hubRow.getByRole('link', { name: 'Podstrony' }).click();
    await expect(page.getByText('Na tym poziomie nie ma jeszcze żadnych stron.')).toBeVisible();
    await addPage(page, 'Siódmy zmysł');
    await addPage(page, 'Ósmy zmysł');

    const levelRows = page.getByRole('row').filter({ has: page.getByRole('link', { name: 'Podstrony' }) });
    await expect(levelRows).toHaveCount(2);
    await expect(levelRows.first()).toContainText('Siódmy zmysł');
    await expect(page.getByRole('button', { name: 'Przesuń wyżej: Siódmy zmysł' })).toBeDisabled();
    await page.getByRole('button', { name: 'Przesuń niżej: Siódmy zmysł' }).click();
    await expect(levelRows.first()).toContainText('Ósmy zmysł');
    await expect(page.getByRole('button', { name: 'Przesuń niżej: Siódmy zmysł' })).toBeDisabled();

    await visit(page, '/kosmologia');
    await expect(page.getByRole('article').getByRole('link', { name: /zmysł/ })).toHaveText([
      'Ósmy zmysł',
      'Siódmy zmysł',
    ]);

    await visit(page, '/admin/strony');
    await hubRow.getByRole('link', { name: 'Podstrony' }).click();
    await page.getByRole('link', { name: 'Ósmy zmysł', exact: true }).click();
    const parent = page.getByRole('group', { name: 'Strona nadrzędna' });
    await expect(parent.getByText('/kosmologia')).toBeVisible();
    await parent.getByLabel('Zmień stronę nadrzędną').fill('Mitol');
    await parent.getByRole('button', { name: /Mitologia/ }).click();
    await expect(parent.getByText('/mitologia')).toBeVisible();
    await page.getByRole('button', { name: 'Zapisz' }).click();

    await expect(page).toHaveURL(/\/admin\/strony\?parent=\d+$/);
    await expect(page.getByRole('navigation', { name: 'Poziom w drzewie stron' })).toContainText('Mitologia');
    await expect(page.getByRole('row', { name: /Ósmy zmysł/ })).toBeVisible();
    await visit(page, '/mitologia/osmy-zmysl');
    await expect(page.getByRole('heading', { level: 1, name: 'Ósmy zmysł' })).toBeVisible();
    await expect(
      page.getByRole('navigation', { name: 'Ścieżka nawigacji' }).getByRole('link', { name: 'Mitologia' }),
    ).toBeVisible();
    expect((await page.request.get('/kosmologia/osmy-zmysl')).status()).toBe(404);

    await visit(page, '/admin/strony');
    await page
      .getByRole('row', { name: /Mitologia/ })
      .getByRole('link', { name: 'Podstrony' })
      .click();
    await page.getByRole('link', { name: 'Ósmy zmysł', exact: true }).click();
    await parent.getByRole('button', { name: 'Przenieś na poziom główny' }).click();
    await expect(parent.getByText('Brak — strona leży na poziomie głównym')).toBeVisible();
    await page.getByRole('button', { name: 'Zapisz' }).click();
    await expect(page).toHaveURL('/admin/strony');
    const movedRow = page.getByRole('row', { name: /Ósmy zmysł/ });
    await expect(movedRow).toBeVisible();
    expect((await page.request.get('/osmy-zmysl')).status()).toBe(200);

    await confirmRemoval(hubRow, 'tę stronę');
    await expect(page.getByText('Ta strona ma podstrony. Najpierw przenieś je lub usuń.')).toBeVisible();
    await expect(hubRow).toBeVisible();

    await confirmRemoval(movedRow, 'tę stronę');
    await expect(movedRow).toHaveCount(0);
    expect((await page.request.get('/osmy-zmysl')).status()).toBe(404);

    await hubRow.getByRole('link', { name: 'Podstrony' }).click();
    await confirmRemoval(page.getByRole('row', { name: /Siódmy zmysł/ }), 'tę stronę');
    await expect(page.getByText('Na tym poziomie nie ma jeszcze żadnych stron.')).toBeVisible();
    await page.getByRole('link', { name: 'Poziom główny' }).click();
    await confirmRemoval(hubRow, 'tę stronę');
    await expect(hubRow).toHaveCount(0);
    expect((await page.request.get('/kosmologia')).status()).toBe(404);
  });

  test('an administrator builds, restricts and dismantles a forum section', async ({ page, browser }) => {
    const structureTabs = page.getByRole('navigation', { name: 'Struktura forum' });
    await signIn(page, { name: 'Admin Struktury', role: 'admin' });
    await visit(page, '/admin/forum/kategorie');
    await page.getByRole('button', { name: 'Dodaj kategorię' }).click();
    await page.getByLabel('Nazwa').fill('Zaświaty');
    await page.getByLabel('Kolejność').fill('5');
    await page.getByRole('button', { name: 'Zapisz' }).click();
    const categoryRow = page.getByRole('row', { name: /Zaświaty/ });
    await expect(categoryRow).toBeVisible();

    await structureTabs.getByRole('link', { name: 'Działy' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Działy forum' })).toBeVisible();
    await page.getByRole('button', { name: 'Dodaj dział' }).click();
    await page.getByLabel('Nazwa').fill('Hades');
    await page.getByLabel('Kategoria').selectOption({ label: 'Zaświaty' });
    await page.getByLabel('Opis').fill('Dyskusje o sadze Hadesa.');
    await page.getByRole('button', { name: 'Zapisz' }).click();
    const sectionRow = page.getByRole('row', { name: /Hades/ });
    await expect(sectionRow).toContainText('Zaświaty');
    await expect(sectionRow).toContainText('Publiczny');

    await visit(page, '/forum');
    await expect(page.getByRole('heading', { level: 2, name: 'Zaświaty' })).toBeVisible();
    await page.getByRole('link', { name: 'Hades', exact: true }).click();
    await expect(page).toHaveURL('/forum/dzial/hades');
    await expect(page.getByRole('heading', { level: 1, name: 'Hades' })).toBeVisible();

    await visit(page, '/admin/forum');
    await sectionRow.getByRole('button', { name: 'Edytuj' }).click();
    await page.locator('label').filter({ hasText: 'Tylko dla redakcji' }).click();
    await page.getByRole('button', { name: 'Zapisz' }).click();
    await expect(sectionRow).toContainText('Redakcja');

    const visitorContext = await browser.newContext();
    const visitorPage = await visitorContext.newPage();
    expect((await visitorPage.request.get('/forum/dzial/hades')).status()).toBe(404);
    await visit(visitorPage, '/forum');
    await expect(visitorPage.getByRole('link', { name: 'Postacie' })).toBeVisible();
    await expect(visitorPage.getByRole('link', { name: 'Hades', exact: true })).toHaveCount(0);
    await visitorContext.close();

    await confirmRemoval(page.getByRole('row', { name: /Postacie/ }), 'ten dział forum');
    await expect(page.getByText('W tym dziale są tematy. Najpierw przenieś je lub usuń.')).toBeVisible();
    await expect(page.getByRole('row', { name: /Postacie/ })).toBeVisible();

    await structureTabs.getByRole('link', { name: 'Kategorie' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Kategorie forum' })).toBeVisible();
    await confirmRemoval(categoryRow, 'tę kategorię');
    await expect(page.getByText('W tej kategorii są działy. Najpierw przenieś je lub usuń.')).toBeVisible();
    await categoryRow.getByRole('button', { name: 'Edytuj' }).click();
    await page.getByLabel('Nazwa').fill('Kraina Umarłych');
    await page.getByRole('button', { name: 'Zapisz' }).click();
    const renamedRow = page.getByRole('row', { name: /Kraina Umarłych/ });
    await expect(renamedRow).toBeVisible();

    await structureTabs.getByRole('link', { name: 'Działy' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Działy forum' })).toBeVisible();
    await expect(sectionRow).toContainText('Kraina Umarłych');
    await confirmRemoval(sectionRow, 'ten dział forum');
    await expect(sectionRow).toHaveCount(0);
    await structureTabs.getByRole('link', { name: 'Kategorie' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Kategorie forum' })).toBeVisible();
    await confirmRemoval(renamedRow, 'tę kategorię');
    await expect(renamedRow).toHaveCount(0);

    await visit(page, '/forum');
    await expect(page.getByRole('heading', { level: 2, name: 'Kraina Umarłych' })).toHaveCount(0);
  });

  test('an administrator takes a role away and the panel refuses changes it does not allow', async ({
    page,
    browser,
  }) => {
    const memberContext = await browser.newContext();
    const memberPage = await memberContext.newPage();
    await signIn(memberPage, { name: 'Odwołany Moderator', role: 'moderator', permissions: ['news'] });
    await visit(memberPage, '/admin');
    await expect(
      memberPage.getByRole('navigation', { name: 'Panel administratora' }).getByRole('link', { name: 'Newsy' }),
    ).toBeVisible();

    const administrator = await signIn(page, { name: 'Admin Odwołań', role: 'admin' });
    await visit(page, '/admin/uzytkownicy');
    const search = page.getByRole('searchbox', { name: 'Szukaj' });
    await search.fill('Admin Odwołań');
    const ownRow = page.getByRole('row', { name: /Admin Odwołań/ });
    await expect(ownRow).toContainText('(to Ty)');
    await expect(ownRow.getByRole('button')).toHaveCount(0);
    const ownAccountApi = `/api/admin/users/${administrator.id}`;
    const refusedDemotion = await page.request.patch(`${ownAccountApi}/role`, { data: { role: 'user' } });
    expect(refusedDemotion.status()).toBe(409);
    expect(await refusalOf(refusedDemotion)).toBe('ERRORS.CANNOT_DEMOTE_SELF');
    const refusedBan = await page.request.patch(`${ownAccountApi}/ban`, { data: { isBanned: true } });
    expect(refusedBan.status()).toBe(409);
    expect(await refusalOf(refusedBan)).toBe('ERRORS.CANNOT_BAN_SELF');

    await search.fill('odwołany');
    const memberRow = page.getByRole('row', { name: /Odwołany Moderator/ });
    await expect(memberRow).toContainText('Newsy, kategorie i tagi');
    await memberRow.getByRole('button', { name: 'Rola' }).click();
    const roleForm = page.locator('form').filter({ hasText: 'Rola i uprawnienia: Odwołany Moderator' });
    await roleForm.getByLabel('Rola', { exact: true }).selectOption('user');
    await roleForm.getByRole('button', { name: 'Zapisz' }).click();
    await expect(page.getByText('Rola zapisana')).toBeVisible();
    await expect(memberRow).toContainText('Użytkownik');
    await expect(memberRow).not.toContainText('Newsy, kategorie i tagi');

    await visit(memberPage, '/admin');
    await expect(memberPage).toHaveURL('/');
    await openAccountMenu(memberPage, 'Odwołany Moderator');
    await expect(memberPage.getByRole('link', { name: 'Twoje konto' })).toBeVisible();
    await expect(memberPage.getByRole('link', { name: 'Panel administratora' })).toHaveCount(0);
    expect((await memberPage.request.get('/api/admin/news')).status()).toBe(403);

    await memberRow.getByRole('button', { name: 'Rola' }).click();
    expect((await memberPage.request.delete('/api/account')).ok()).toBe(true);
    await memberContext.close();
    await roleForm.getByLabel('Rola', { exact: true }).selectOption('moderator');
    await roleForm.getByRole('button', { name: 'Zapisz' }).click();
    await expect(roleForm.getByRole('alert')).toHaveText('Konta nieaktywnego nie można zmieniać');
    await roleForm.getByRole('button', { name: 'Anuluj' }).click();

    const candidateContext = await browser.newContext();
    const candidate = await signIn(await candidateContext.newPage(), { name: 'Kandydat Na Admina' });
    const guardContext = await browser.newContext();
    const guardPage = await guardContext.newPage();
    await signIn(guardPage, { name: 'Strażnik Kont', role: 'moderator', permissions: ['users'] });
    await visit(guardPage, '/admin/uzytkownicy');
    await guardPage.getByRole('searchbox', { name: 'Szukaj' }).fill('kandydat');
    const candidateRow = guardPage.getByRole('row', { name: /Kandydat Na Admina/ });
    await expect(candidateRow.getByRole('button', { name: 'Zablokuj' })).toBeVisible();
    await expect(candidateRow.getByRole('button', { name: 'Rola' })).toHaveCount(0);
    await expect(guardPage.getByRole('columnheader', { name: 'E-mail' })).toHaveCount(0);

    const promotion = await page.request.patch(`/api/admin/users/${candidate.id}/role`, { data: { role: 'admin' } });
    expect(promotion.ok()).toBe(true);
    await candidateRow.getByRole('button', { name: 'Zablokuj' }).click();
    await expect(guardPage.getByText('Administratora może zablokować tylko administrator')).toBeVisible();
    await visit(guardPage, '/admin/uzytkownicy');
    await guardPage.getByRole('searchbox', { name: 'Szukaj' }).fill('kandydat');
    await expect(candidateRow).toContainText('Administrator');
    await expect(candidateRow.getByRole('button')).toHaveCount(0);
    await candidateContext.close();
    await guardContext.close();
  });
});
