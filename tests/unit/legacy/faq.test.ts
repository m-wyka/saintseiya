import { describe, expect, it } from 'vitest';
import { isFaqPage, splitFaqPage } from '../../../scripts/legacy/faq';

describe('splitFaqPage', () => {
  it('groups bold questions with the content below them under the centred headings', () => {
    const html = [
      '<p style="text-align:center"><span style="color:#ffcc99"><strong>FAQ</strong></span></p>',
      '<p style="text-align:center"><span style="color:#ffcc99"><strong>STRONA</strong></span></p>',
      '<p> </p>',
      '<p><strong>1. Kto zarządza stroną?</strong></p>',
      '<p>Redakcja w składzie:</p>',
      '<p>- Hekate,</p>',
      '<p>&nbsp;</p>',
      '<p><strong>2. Do czego służą przyciski?</strong></p>',
      '<p><img src="/media/panel.png" alt="" /></p>',
      '<p style="text-align:center"><span style="color:#ffcc99"><strong>FORUM</strong></span></p>',
      '<p><strong>1. Czym są <em>ostrzeżenia</em>?</strong></p>',
      '<p>Lżejszą formą egzekwowania regulaminu.</p>',
    ].join('\n');

    expect(splitFaqPage(html)).toEqual([
      {
        name: 'STRONA',
        items: [
          { title: 'Kto zarządza stroną?', descriptionHtml: '<p>Redakcja w składzie:</p>\n<p>- Hekate,</p>' },
          { title: 'Do czego służą przyciski?', descriptionHtml: '<p><img src="/media/panel.png" alt="" /></p>' },
        ],
      },
      {
        name: 'FORUM',
        items: [{ title: 'Czym są ostrzeżenia?', descriptionHtml: '<p>Lżejszą formą egzekwowania regulaminu.</p>' }],
      },
    ]);
  });

  it('treats a bold paragraph right below a question as its answer', () => {
    const html =
      '<p><strong>Dlaczego nie mogę pobrać mangi?</strong></p>\n<p><strong>Zrezygnowaliśmy z tego.</strong></p>';

    expect(splitFaqPage(html)).toEqual([
      {
        name: 'FAQ',
        items: [
          {
            title: 'Dlaczego nie mogę pobrać mangi?',
            descriptionHtml: '<p><strong>Zrezygnowaliśmy z tego.</strong></p>',
          },
        ],
      },
    ]);
  });

  it('splits a paragraph holding both the question and its answer', () => {
    const html = '<p> <br /><br /><strong>9. Czy prowadzicie rekrutację?</strong><br /><br />Zawsze chętnie.</p>';

    expect(splitFaqPage(html)[0]!.items).toEqual([
      { title: 'Czy prowadzicie rekrutację?', descriptionHtml: '<p>Zawsze chętnie.</p>' },
    ]);
  });

  it('turns a heading followed by plain content into a question of the current category', () => {
    const html = [
      '<p style="text-align:center"><strong>FORUM</strong></p>',
      '<p><strong>Czemu zostałem zbanowany?</strong></p>',
      '<p>Bo zignorowałeś ostrzeżenia.</p>',
      '<p style="text-align:center"><strong>JESTEŚCIE OKROPNI:</strong></p>',
      '<p style="text-align:center"><img src="/media/masc.png" alt="" /></p>',
      '<p style="text-align:right">Redakcja</p>',
      '<p><strong>Pytanie bez odpowiedzi</strong></p>',
    ].join('\n');

    expect(splitFaqPage(html)).toEqual([
      {
        name: 'FORUM',
        items: [
          { title: 'Czemu zostałem zbanowany?', descriptionHtml: '<p>Bo zignorowałeś ostrzeżenia.</p>' },
          {
            title: 'JESTEŚCIE OKROPNI:',
            descriptionHtml:
              '<p style="text-align:center"><img src="/media/masc.png" alt="" /></p>\n<p style="text-align:right">Redakcja</p>',
          },
        ],
      },
    ]);
  });
});

describe('isFaqPage', () => {
  it('recognises the legacy FAQ page by its menu title', () => {
    const page = { id: 1, content: '', access: 0, allowsComments: true };

    expect(isFaqPage({ ...page, title: 'MENU - FAQ' })).toBe(true);
    expect(isFaqPage({ ...page, title: 'MENU - Regulamin' })).toBe(false);
  });
});
