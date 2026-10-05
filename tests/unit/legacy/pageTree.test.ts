import { describe, expect, it } from 'vitest';
import { planPageTree } from '../../../scripts/legacy/pageTree';
import type { LegacyPage } from '../../../scripts/legacy/pageTree';

const BODY = 'Treść strony wystarczająco długa, żeby nie była zaślepką bez zawartości.';
const linkTo = (...ids: number[]) => ids.map((id) => `<a href="viewpage.php?page_id=${id}">x</a>`).join(' ');

const page = (id: number, title: string, content = BODY, access = 0): LegacyPage => ({
  id,
  title,
  content,
  access,
  allowsComments: true,
});

const byLegacyId = (plan: ReturnType<typeof planPageTree>, legacyId: number) =>
  plan.find((planned) => planned.legacyId === legacyId)!;

describe('planPageTree', () => {
  it('skips placeholders and empty pages', () => {
    const plan = planPageTree([page(1, '00 Pusta'), page(2, 'MENU - Regulamin', ''), page(3, 'MENU - FAQ')], [3]);
    expect(plan.map((planned) => planned.legacyId)).toEqual([3]);
  });

  it('hides generic namespaces in root titles and keeps meaningful ones', () => {
    const plan = planPageTree(
      [
        page(1, 'MENU - Regulamin'),
        page(2, 'MITOLOGIA - GRECKA'),
        page(3, 'INFORMACJE - Saint Seiya - Anime'),
        page(4, 'FAN FICTION'),
      ],
      [1, 2, 3, 4],
    );
    expect(plan.map((planned) => [planned.title, planned.path, planned.kind])).toEqual([
      ['Regulamin', 'regulamin', 'article'],
      ['Mitologia', 'mitologia', 'hub'],
      ['Grecka', 'mitologia/grecka', 'article'],
      ['Saint Seiya', 'saint-seiya', 'hub'],
      ['Anime', 'saint-seiya/anime', 'article'],
      ['Fan Fiction', 'fan-fiction', 'article'],
    ]);
  });

  it('places linked pages under the hub and groups them by the middle title segments', () => {
    const plan = planPageTree(
      [
        page(335, 'MITOLOGIA - GRECKA', `${BODY} ${linkTo(367, 366, 425)}`),
        page(367, 'MITOLOGIA GRECKA - BOGOWIE - Posejdon'),
        page(366, 'MITOLOGIA GRECKA - BOGOWIE - Atena'),
        page(425, 'MITOLOGIA GRECKA - POSTACIE - Scylla'),
      ],
      [335],
    );
    expect(plan.map((planned) => [planned.path, planned.kind, planned.legacyId])).toEqual([
      ['mitologia', 'hub', null],
      ['mitologia/grecka', 'article', 335],
      ['mitologia/grecka/bogowie', 'hub', null],
      ['mitologia/grecka/bogowie/posejdon', 'article', 367],
      ['mitologia/grecka/bogowie/atena', 'article', 366],
      ['mitologia/grecka/postacie', 'hub', null],
      ['mitologia/grecka/postacie/scylla', 'article', 425],
    ]);
    expect(byLegacyId(plan, 366).sortOrder).toBe(1);
    expect(byLegacyId(plan, 367).title).toBe('Posejdon');
  });

  it('strips the part of the title already expressed by the parent', () => {
    const plan = planPageTree(
      [
        page(34, 'INFORMACJE - Saint Seiya - Charakterystyki Postaci', `${BODY} ${linkTo(30)}`),
        page(30, 'INFORMACJE - Saint Seiya - Charakterystyki Postaci - Widma Ziemskie'),
      ],
      [34],
    );
    expect(byLegacyId(plan, 30).path).toBe('saint-seiya/charakterystyki-postaci/widma-ziemskie');
  });

  it('reuses an existing sibling page as the group when the names match', () => {
    const plan = planPageTree(
      [
        page(105, 'FAN FICTION', `${BODY} ${linkTo(10, 11)}`),
        page(10, 'FAN FICTION - Aylis'),
        page(11, 'FAN FICTION - Aylis - Wojna Żywiołów 1'),
      ],
      [105],
    );
    expect(plan.map((planned) => planned.path)).toEqual([
      'fan-fiction',
      'fan-fiction/aylis',
      'fan-fiction/aylis/wojna-zywiolow-1',
    ]);
    expect(byLegacyId(plan, 11).parentKey).toBe(byLegacyId(plan, 10).key);
  });

  it('adopts pages nobody links to by the longest matching title prefix', () => {
    const plan = planPageTree(
      [
        page(3, 'INFORMACJE - Omega - Anime'),
        page(322, 'INFORMACJE - Omega - Anime - Streszczenia 3'),
        page(900, 'Zupełnie osobna strona'),
      ],
      [3],
    );
    expect(byLegacyId(plan, 322).path).toBe('omega/anime/streszczenia-3');
    expect(byLegacyId(plan, 900).parentKey).toBeNull();
  });

  it('lets a real page take over a group created earlier for its children', () => {
    const plan = planPageTree(
      [page(11, 'INFORMACJE - Saint Seiya - Anime - Seria Hades'), page(3, 'INFORMACJE - Saint Seiya - Anime')],
      [11, 3],
    );
    expect(plan.map((planned) => [planned.path, planned.legacyId])).toEqual([
      ['saint-seiya', null],
      ['saint-seiya/anime', 3],
      ['saint-seiya/anime/seria-hades', 11],
    ]);
  });

  it('treats differently written namespaces as the same section', () => {
    const plan = planPageTree(
      [
        page(1, 'MITOLOGIA RZYMSKA'),
        page(2, 'MITOLOGIA - GRECKA'),
        page(3, 'Fan - ARTY - komiksy Korin2b'),
        page(4, 'Fan Arty - Kochei 38'),
      ],
      [1, 2, 3, 4],
    );
    expect(plan.map((planned) => planned.path)).toEqual([
      'mitologia',
      'mitologia/rzymska',
      'mitologia/grecka',
      'fan-arty',
      'fan-arty/komiksy-korin2b',
      'fan-arty/kochei-38',
    ]);
  });

  it('keeps sibling slugs unique and avoids reserved root addresses', () => {
    const plan = planPageTree([page(1, 'MENU - Forum'), page(2, 'INNE - Forum'), page(3, 'Galeria')], [1, 2, 3]);
    expect(plan.map((planned) => planned.path)).toEqual(['forum-2', 'forum-3', 'galeria-2']);
  });

  it('publishes member-only pages and keeps staff-only pages as drafts', () => {
    const plan = planPageTree([page(1, 'A', BODY, 101), page(2, 'B', BODY, 102), page(3, 'C', BODY, 103)], [1, 2, 3]);
    expect(plan.map((planned) => planned.status)).toEqual(['published', 'draft', 'draft']);
  });

  it('survives pages that link to each other', () => {
    const plan = planPageTree(
      [page(1, 'MENU - A', `${BODY} ${linkTo(2)}`), page(2, 'MENU - B', `${BODY} ${linkTo(1)}`)],
      [1],
    );
    expect(plan.map((planned) => planned.path)).toEqual(['a', 'a/b']);
  });
});
