import { describe, expect, it } from 'vitest';
import { planNavigation } from '../../../scripts/legacy/navigation';

const header = (image: string) => ({
  name: `<img src='http://saintseiya.netserwer.pl/${image}.jpg'   border='0'>`,
  url: '---',
  visibility: 0,
});
const link = (name: string, url: string, visibility = 0) => ({ name, url, visibility });
const linkablePages = new Map([
  [16, 'INFORMACJE - SAINT SEIYA - Manga'],
  [18, 'INFORMACJE - Lost Canvas - Manga'],
  [65, 'MULTIMEDIA - Odcinki - Saint Seiya'],
  [321, 'MULTIMEDIA - Odcinki - Omega'],
  [47, 'Fan Arty - Kochei 38'],
]);

describe('planNavigation', () => {
  it('splits links into sections and groups by the header graphics', () => {
    const sections = planNavigation(
      [
        link('Strona główna', 'index.php'),
        link('Forum', 'forum/index.php'),
        header('informacje'),
        header('ss'),
        link('Manga', 'viewpage.php?page_id=16'),
        header('lc'),
        link('Manga', 'viewpage.php?page_id=18'),
        header('galeria'),
        link('Avatary', 'photogallery.php?album_id=8'),
      ],
      linkablePages,
    );
    expect(sections).toEqual([
      {
        title: 'Menu główne',
        links: [
          { groupTitle: null, label: 'Strona główna', legacyUrl: 'index.php' },
          { groupTitle: null, label: 'Forum', legacyUrl: 'forum/index.php' },
        ],
      },
      {
        title: 'Informacje',
        links: [
          { groupTitle: 'Saint Seiya', label: 'Manga', legacyUrl: 'viewpage.php?page_id=16' },
          { groupTitle: 'Lost Canvas', label: 'Manga', legacyUrl: 'viewpage.php?page_id=18' },
        ],
      },
      { title: 'Galeria', links: [{ groupTitle: null, label: 'Avatary', legacyUrl: 'photogallery.php?album_id=8' }] },
    ]);
  });

  it('leaves out links that only the site owner could see', () => {
    const sections = planNavigation(
      [link('Saint Seiya', 'viewpage.php?page_id=65', 103), link('Linki', 'weblinks.php')],
      linkablePages,
    );
    expect(sections[0]!.links.map((planned) => planned.label)).toEqual(['Linki']);
  });

  it('reduces decorated labels to plain text', () => {
    const sections = planNavigation(
      [
        link(
          '<font color="#e8ff9a">Polska Encyklopedia:</font><BR><I> "Saint Seiya Wiki"',
          'http://pl.saintseiya.wikia.com/',
        ),
        link('&#937;mega', 'viewpage.php?page_id=321'),
      ],
      linkablePages,
    );
    expect(sections[0]!.links.map((planned) => planned.label)).toEqual([
      'Polska Encyklopedia: Saint Seiya Wiki',
      'Ωmega',
    ]);
  });

  it('drops sections that end up empty', () => {
    const sections = planNavigation(
      [header('fans'), header('partnerzy'), link('Wiki', 'http://example.com')],
      linkablePages,
    );
    expect(sections.map((section) => section.title)).toEqual(['Partnerzy']);
  });

  it('drops links to pages that are empty, hidden or missing', () => {
    const sections = planNavigation(
      [link('Seiyuu', 'viewpage.php?page_id=233'), link('Manga', 'viewpage.php?page_id=16')],
      linkablePages,
    );
    expect(sections[0]!.links.map((planned) => planned.label)).toEqual(['Manga']);
  });

  it('drops stale links to page numbers later reused for fan art, except in the fan section', () => {
    const sections = planNavigation(
      [
        header('informacje'),
        link('Zbroje', 'viewpage.php?page_id=47'),
        header('fans'),
        link('Komiks', 'viewpage.php?page_id=47'),
      ],
      linkablePages,
    );
    expect(sections).toEqual([
      { title: 'Fans', links: [{ groupTitle: null, label: 'Komiks', legacyUrl: 'viewpage.php?page_id=47' }] },
    ]);
  });
});
