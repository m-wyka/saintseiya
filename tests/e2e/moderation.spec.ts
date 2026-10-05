import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import sharp from 'sharp';
import { signIn, visit } from './helpers';

const confirmRemoval = async (scope: Locator | Page, label = 'Usuń', confirmLabel = 'Na pewno?') => {
  await scope.getByRole('button', { name: label, exact: true }).click();
  await scope.getByRole('button', { name: confirmLabel }).click();
};

const solidPng = async (name: string, color: string) => ({
  name,
  mimeType: 'image/png',
  buffer: await sharp({ create: { width: 320, height: 200, channels: 3, background: color } })
    .png()
    .toBuffer(),
});

test.describe('moderation and the remaining panel sections', () => {
  test('a forum moderator edits and removes a reply, sticks, moves and removes a thread', async ({ page, browser }) => {
    await signIn(page, { name: 'Strażnik Forum', role: 'moderator', permissions: ['forum'] });
    await visit(page, '/forum/dzial/postacie');
    await page.getByRole('link', { name: 'Nowy temat' }).click();
    await page.getByLabel('Tytuł tematu').fill('Temat do moderacji');
    await page.getByRole('textbox', { name: 'Treść pierwszego posta' }).click();
    await page.keyboard.type('Pierwszy post zostaje.');
    await page.getByRole('button', { name: 'Załóż temat' }).click();
    await expect(page).toHaveURL(/\/forum\/temat\/\d+$/);
    const threadUrl = page.url();

    const memberContext = await browser.newContext();
    const memberPage = await memberContext.newPage();
    await signIn(memberPage, { name: 'Gaduła Forum' });
    await visit(memberPage, threadUrl);
    await memberPage.getByRole('textbox', { name: 'Treść odpowiedzi' }).click();
    await memberPage.keyboard.type('Odpowiedź z literówkom');
    await memberPage.getByRole('button', { name: 'Wyślij odpowiedź' }).click();
    await expect(memberPage.getByRole('article').filter({ hasText: 'Odpowiedź z literówkom' })).toBeVisible();

    await visit(page, threadUrl);
    const reply = page.getByRole('article').filter({ hasText: 'Gaduła Forum' });
    await reply.getByRole('button', { name: 'Edytuj' }).click();
    await reply.getByRole('textbox', { name: 'Treść posta' }).click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.type('Odpowiedź poprawiona');
    await reply.getByRole('button', { name: 'Zapisz zmiany' }).click();
    await expect(reply.getByText('Odpowiedź poprawiona')).toBeVisible();
    await expect(reply.getByText('Edytowano')).toBeVisible();

    const moderation = page.getByRole('region', { name: 'Moderacja tematu' });
    await moderation.getByRole('button', { name: 'Przyklej' }).click();
    await expect(page.getByText('Temat przyklejony')).toBeVisible();
    await visit(page, '/forum/dzial/postacie');
    await expect(page.getByRole('listitem').filter({ hasText: 'Temat do moderacji' })).toContainText('Przyklejony');

    await visit(page, threadUrl);
    await confirmRemoval(reply);
    await expect(page.getByText('Post usunięty')).toBeVisible();
    await expect(reply).toHaveCount(0);
    await expect(page.getByText('Pierwszy post zostaje.')).toBeVisible();

    await moderation.getByRole('button', { name: 'Przenieś', exact: true }).click();
    await page.getByLabel('Dział docelowy').selectOption({ label: 'Redakcja' });
    await moderation.getByRole('button', { name: 'Przenieś temat' }).click();
    await expect(page.getByText('Temat przeniesiony')).toBeVisible();
    await expect(
      page.getByRole('navigation', { name: 'Ścieżka nawigacji' }).getByRole('link', { name: 'Redakcja' }),
    ).toBeVisible();
    expect((await memberPage.request.get(threadUrl)).status()).toBe(404);
    await memberContext.close();

    await confirmRemoval(moderation, 'Usuń temat', 'Usunąć cały temat?');
    await expect(page).toHaveURL('/forum/dzial/redakcja');
    await expect(page.getByText('W tym dziale nie ma jeszcze żadnego tematu.')).toBeVisible();
  });

  test('a hidden comment disappears from the site until it is shown again', async ({ page, browser }) => {
    const newsAddress = '/newsy/saint-seiya-revolution-powraca';
    const visitorContext = await browser.newContext();
    const visitorPage = await visitorContext.newPage();

    await signIn(page, { name: 'Strażnik Komentarzy', role: 'moderator', permissions: ['comments'] });
    await visit(page, '/admin/komentarze');
    const commentRow = page.getByRole('row', { name: /Świetna wiadomość!/ });
    await commentRow.getByRole('button', { name: 'Ukryj' }).click();
    await expect(page.getByText('Komentarz ukryty')).toBeVisible();

    await visit(visitorPage, newsAddress);
    await expect(visitorPage.getByText('Pełna treść newsa o powrocie.')).toBeVisible();
    await expect(visitorPage.getByText('Świetna wiadomość!')).toHaveCount(0);

    await commentRow.getByRole('button', { name: 'Pokaż' }).click();
    await expect(page.getByText('Komentarz znów widoczny')).toBeVisible();
    await visit(visitorPage, newsAddress);
    await expect(visitorPage.getByText('Świetna wiadomość!')).toBeVisible();
    await visitorContext.close();
  });

  test('an administrator runs a poll from creation to removal', async ({ page }) => {
    const question = 'Który bóg jest najgroźniejszy?';
    await signIn(page, { name: 'Admin Ankiet', role: 'admin' });
    await visit(page, '/admin/ankiety');
    await page.getByRole('link', { name: 'Dodaj ankietę' }).click();
    await page.getByLabel('Pytanie').fill(question);
    await page.getByRole('textbox', { name: 'Odpowiedź 1', exact: true }).fill('Hades');
    await page.getByRole('textbox', { name: 'Odpowiedź 2', exact: true }).fill('Posejdon');
    await page.getByRole('button', { name: 'Dodaj odpowiedź' }).click();
    await page.getByRole('textbox', { name: 'Odpowiedź 3', exact: true }).fill('Apollo');
    await page.getByRole('button', { name: 'Zapisz' }).click();
    await expect(page).toHaveURL('/admin/ankiety');

    await visit(page, '/ankiety');
    const publicPoll = page.getByRole('article').filter({ hasText: question });
    await expect(publicPoll.getByRole('button', { name: 'Głosuję' })).toHaveCount(3);

    await visit(page, '/admin/ankiety');
    const pollRow = page.getByRole('row', { name: new RegExp(question.replace('?', '\\?')) });
    await pollRow.getByRole('button', { name: 'Zakończ' }).click();
    await expect(page.getByText('Ankieta zakończona')).toBeVisible();
    await expect(pollRow.getByRole('button', { name: 'Wznów' })).toBeVisible();

    await visit(page, '/ankiety');
    await expect(publicPoll.getByText('Apollo')).toBeVisible();
    await expect(publicPoll.getByRole('button', { name: 'Głosuję' })).toHaveCount(0);

    await visit(page, '/admin/ankiety');
    await confirmRemoval(pollRow);
    await expect(page.getByText('Usunięto')).toBeVisible();
    await expect(pollRow).toHaveCount(0);
  });

  test('an administrator adds, reorders, renames and removes a menu link', async ({ page }) => {
    await signIn(page, { name: 'Admin Nawigacji', role: 'admin' });
    await visit(page, '/admin/nawigacja');
    const section = page.getByRole('region', { name: 'Menu główne' });
    await section.getByRole('button', { name: 'Dodaj odnośnik' }).click();
    await section.getByLabel('Nazwa odnośnika').fill('Kącik rycerza');
    await section.getByRole('textbox', { name: 'Adres', exact: true }).fill('/linki');
    await section.getByRole('button', { name: 'Zapisz' }).click();
    await expect(section.getByRole('listitem')).toHaveCount(3);
    await expect(section.getByRole('listitem').nth(2)).toContainText('Kącik rycerza');

    await section.getByRole('button', { name: 'Przesuń wyżej: Kącik rycerza' }).click();
    await expect(section.getByRole('listitem').nth(1)).toContainText('Kącik rycerza');

    await visit(page, '/');
    const siteMenu = page.getByRole('complementary', { name: 'Nawigacja po działach' });
    await siteMenu.getByRole('link', { name: 'Kącik rycerza' }).click();
    await expect(page).toHaveURL('/linki');

    await visit(page, '/admin/nawigacja');
    const menuLink = section.getByRole('listitem').filter({ hasText: 'Kącik rycerza' });
    await menuLink.getByRole('button', { name: 'Edytuj' }).click();
    await section.getByLabel('Nazwa odnośnika').fill('Kącik giermka');
    await section.getByRole('button', { name: 'Zapisz' }).click();
    const renamedLink = section.getByRole('listitem').filter({ hasText: 'Kącik giermka' });
    await expect(renamedLink).toBeVisible();

    await confirmRemoval(renamedLink);
    await expect(page.getByText('Usunięto')).toBeVisible();
    await expect(section.getByRole('listitem')).toHaveCount(2);
  });

  test('an administrator adds, renames and removes a video', async ({ page }) => {
    await signIn(page, { name: 'Admin Video', role: 'admin' });
    await visit(page, '/admin/video');
    await page.getByRole('button', { name: 'Dodaj film' }).click();
    await page.getByRole('textbox', { name: 'Tytuł', exact: true }).fill('Soldier Dream');
    await page.getByLabel('Film z YouTube').fill('https://youtu.be/QH2-TGUlwu4');
    await page.getByRole('button', { name: 'Zapisz' }).click();
    await expect(page.getByText('Zapisano')).toBeVisible();
    const videoRow = page.getByRole('row', { name: /Soldier Dream/ });
    await expect(videoRow).toContainText('AMV');

    await visit(page, '/video');
    await expect(page.getByText('Soldier Dream')).toBeVisible();

    await visit(page, '/admin/video');
    await videoRow.getByRole('button', { name: 'Edytuj' }).click();
    await expect(page.getByLabel('Film z YouTube')).toHaveValue('QH2-TGUlwu4');
    await page.getByRole('textbox', { name: 'Tytuł', exact: true }).fill('Soldier Dream II');
    await page.getByRole('button', { name: 'Zapisz' }).click();
    await expect(page.getByRole('row', { name: /Soldier Dream II/ })).toBeVisible();

    await confirmRemoval(videoRow);
    await expect(page.getByText('Usunięto')).toBeVisible();
    await expect(videoRow).toHaveCount(0);
  });

  test('an administrator uploads photos to an album, edits, reorders and removes them', async ({ page }) => {
    await signIn(page, { name: 'Admin Galerii', role: 'admin' });
    await visit(page, '/admin/galeria');
    await page
      .getByRole('row', { name: /Tapety/ })
      .getByRole('link', { name: 'Zdjęcia' })
      .click();
    await expect(page.getByRole('heading', { level: 1, name: 'Tapety' })).toBeVisible();
    const albumPanelUrl = page.url();

    const photoCards = page.getByRole('listitem').filter({ has: page.getByRole('img') });
    await expect(photoCards).toHaveCount(1);
    await page
      .getByLabel('Wgraj zdjęcia z dysku')
      .setInputFiles([await solidPng('pegaz.png', '#3355ff'), await solidPng('smok.png', '#22aa55')]);
    await expect(page.getByText('Dodano: 2 zdjęcia')).toBeVisible();
    await expect(photoCards).toHaveCount(3);

    const uploadedCards = photoCards.filter({ hasNotText: 'Złota zbroja' });
    await uploadedCards.first().getByRole('button', { name: 'Edytuj' }).click();
    await page.getByLabel('Tytuł', { exact: true }).fill('Zbroja Pegaza');
    await page.getByRole('button', { name: 'Zapisz' }).click();
    await expect(page.getByText('Zapisano')).toBeVisible();
    const pegasusCard = photoCards.filter({ hasText: 'Zbroja Pegaza' });

    await pegasusCard.getByRole('button', { name: 'Ustaw jako okładkę' }).click();
    await expect(page.getByText('Ustawiono okładkę albumu')).toBeVisible();
    await expect(pegasusCard.getByText('Okładka')).toBeVisible();

    await pegasusCard.getByRole('button', { name: 'Przesuń w lewo: Zbroja Pegaza' }).click();
    await expect(photoCards.first()).toContainText('Zbroja Pegaza');

    await visit(page, '/galeria/tapety');
    await expect(page.getByRole('link', { name: 'Zbroja Pegaza' })).toBeVisible();

    await visit(page, albumPanelUrl);
    const seededCard = photoCards.filter({ hasText: 'Złota zbroja' });
    await seededCard.getByRole('button', { name: 'Ustaw jako okładkę' }).click();
    await expect(seededCard.getByText('Okładka')).toBeVisible();
    await confirmRemoval(uploadedCards.first());
    await expect(photoCards).toHaveCount(2);
    await confirmRemoval(uploadedCards.first());
    await expect(photoCards).toHaveCount(1);
    await expect(photoCards.first()).toContainText('Złota zbroja');
  });
});
