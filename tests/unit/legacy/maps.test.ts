import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createAssetRegistry } from '../../../scripts/legacy/assets';
import type { AssetRegistry } from '../../../scripts/legacy/assets';
import {
  labelFromHref,
  pageBodiesReplacedByMaps,
  prepareMaps,
  resolveWithinFolder,
} from '../../../scripts/legacy/maps';
import type { PreparedMaps } from '../../../scripts/legacy/maps';
import { createLegacyRewriter } from '../../../scripts/legacy/rewriter';

const WINDOWS_1250_Z_WITH_DOT = '\xBF';
const LEGACY_SITE = 'http://saintseiya.netserwer.pl';
const MIGRATED_PAGE = { legacyId: 30, id: 7, title: 'Widma Ziemskie', path: 'postacie/widma-ziemskie' };

const SKY_MAP_HTML = `<html><head><title>Mapa</title></head><body bgcolor="#000">
<table id="Table_01" width="71" border="0" cellpadding="0" cellspacing="0">
  <tr>
    <td><a href="${LEGACY_SITE}/"><img src="images/home.png" width="20" height="10" alt="" /></a></td>
    <td><a href="koziorozec.htm" class="tip"><img src="images/goat.png" width="30" height="10" alt="" /><span> <B>Kozioro${WINDOWS_1250_Z_WITH_DOT}ec</B>
<i>(Capricornus)</i></span></a></td>
    <td><a href="${LEGACY_SITE}/viewpage.php?page_id=30" target="_blank"><img src="images/known.png" width="10" height="10" alt="" /></a></td>
    <td><a href="${LEGACY_SITE}/viewpage.php?page_id=31"><img src="images/lost.png" width="10" height="10" alt="" /></a></td>
    <td><img src="images/spacer.gif" width="1" height="10" alt="" /></td>
  </tr>
</table></body></html>`;

const POPUP_HTML = `<html><head><title>Cefeusz</title><style>p.MsoNormal {color: #fff}</style></head>
<body bgcolor='#000'><p class="MsoNormal"><b>Kozioro${WINDOWS_1250_Z_WITH_DOT}ec</b></p><p><img src="mapki/Koziorozec.png" width="5" height="5"></p></body></html>`;

const ANGELOLOGY_PAGE_CONTENT = `<table id=\\"Table_01\\"><tbody><tr>
<td><a href=\\"/viewpage.php?page_id=30\\"> <img src=\\"/an/images/ANGELOLOGIA_01.png\\" border=\\"0\\" alt=\\"\\" width=\\"12\\" height=\\"8\\" /></a></td>
<td><img src=\\"/an/images/spacer.gif\\" alt=\\"\\" width=\\"1\\" height=\\"8\\" /></td>
</tr></tbody></table>`;

const writeLegacyFile = async (file: string, content: Buffer) => {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, content);
};

const solidImage = (width: number, height: number, background: string): Promise<Buffer> =>
  sharp({ create: { width, height, channels: 3, background } })
    .png()
    .toBuffer();

const pixelAt = async (file: string, x: number): Promise<number[]> => {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return [...data.subarray(x * info.channels, x * info.channels + 3)];
};

const emptyLookups = () => ({
  pagePaths: new Map([[MIGRATED_PAGE.legacyId, MIGRATED_PAGE.path]]),
  newsSlugs: new Map<number, string>(),
  newsCategorySlugs: new Map<number, string>(),
  forumSlugs: new Map<number, string>(),
  threadIds: new Map<number, number>(),
  postIds: new Map<number, number>(),
  albumSlugs: new Map<number, string>(),
  photoIds: new Map<number, number>(),
  userIds: new Map<number, number>(),
});

describe('prepareMaps', () => {
  let workDir: string;
  let uploadsDir: string;
  let assets: AssetRegistry;
  let prepared: PreparedMaps;
  const missingFiles: string[] = [];

  beforeAll(async () => {
    workDir = await mkdtemp(join(tmpdir(), 'legacy-maps-'));
    uploadsDir = join(workDir, 'uploads');
    const legacyDir = join(workDir, 'legacy');
    const legacyFiles: [string, Buffer][] = [
      ['mapa/index.html', Buffer.from(SKY_MAP_HTML, 'latin1')],
      ['mapa/koziorozec.htm', Buffer.from(POPUP_HTML, 'latin1')],
      ['mapa/images/home.png', await solidImage(20, 10, '#ff0000')],
      ['mapa/images/goat.png', await solidImage(30, 10, '#0000ff')],
      ['mapa/images/known.png', await solidImage(10, 10, '#00ff00')],
      ['mapa/mapki/Koziorozec.png', await solidImage(5, 5, '#ffffff')],
      ['an/images/ANGELOLOGIA_01.png', await solidImage(12, 8, '#ffffff')],
      ['themes/saintseiya-g-angeltheme3/images/mapagwiazd.png', await solidImage(4, 4, '#ffffff')],
    ];
    for (const [path, content] of legacyFiles) {
      await writeLegacyFile(join(legacyDir, path), content);
    }
    assets = createAssetRegistry(legacyDir, uploadsDir);
    prepared = await prepareMaps(
      {
        data: {
          pages: [
            {
              id: 388,
              title: 'MITOLOGIA - ANGELOLOGIA',
              content: ANGELOLOGY_PAGE_CONTENT,
              access: 0,
              allowsComments: false,
            },
          ],
        },
        plan: {
          pages: [{ legacyId: MIGRATED_PAGE.legacyId, title: MIGRATED_PAGE.title }],
          ids: { pagesByLegacyId: new Map([[MIGRATED_PAGE.legacyId, MIGRATED_PAGE.id]]) },
        },
        rewriter: createLegacyRewriter(emptyLookups(), assets),
        assets,
        report: { missingFiles },
      },
      uploadsDir,
    );
  });

  afterAll(async () => {
    await rm(workDir, { recursive: true, force: true });
  });

  it('prepares the maps whose sources exist and reports the others as missing', () => {
    expect(prepared.maps.map((map) => map.slug)).toEqual(['mapa-nieba', 'angelologia']);
    expect(prepared.skippedMaps).toBe(2);
    expect(missingFiles).toEqual(expect.arrayContaining(['kr/index.html', 'posejdon.html']));
  });

  it('merges the slices into one picture on the page background and reports missing slices', async () => {
    const [sky] = prepared.maps;
    const mergedFile = join(uploadsDir, sky!.image);
    expect(sky).toMatchObject({ image: 'maps/mapa-nieba.webp', imageWidth: 70, imageHeight: 10 });
    expect(await sharp(mergedFile).metadata()).toMatchObject({ format: 'webp', width: 70, height: 10 });
    const [homeRed, , homeBlue] = await pixelAt(mergedFile, 10);
    const [goatRed, , goatBlue] = await pixelAt(mergedFile, 35);
    const [, knownGreen] = await pixelAt(mergedFile, 55);
    const lostSlice = await pixelAt(mergedFile, 66);
    expect(homeRed).toBeGreaterThan(200);
    expect(homeBlue).toBeLessThan(60);
    expect(goatBlue).toBeGreaterThan(200);
    expect(goatRed).toBeLessThan(60);
    expect(knownGreen).toBeGreaterThan(150);
    expect(Math.max(...lostSlice)).toBeLessThan(100);
    expect(missingFiles).toContain('mapa/images/lost.png');
  });

  it('turns links into url, content and page areas placed in percent', () => {
    const [sky] = prepared.maps;
    expect(sky!.areas).toEqual([
      {
        label: 'Strona główna',
        leftPercent: 0,
        topPercent: 0,
        widthPercent: 28.5714,
        heightPercent: 100,
        targetKind: 'url',
        pageId: null,
        url: '/',
        contentHtml: null,
      },
      {
        label: 'Koziorożec',
        leftPercent: 28.5714,
        topPercent: 0,
        widthPercent: 42.8571,
        heightPercent: 100,
        targetKind: 'content',
        pageId: null,
        url: null,
        contentHtml:
          '<p><strong>Koziorożec</strong></p><p><img src="/media/legacy/mapa/mapki/Koziorozec.png" alt="" width="5" height="5" loading="lazy" /></p>',
      },
      {
        label: MIGRATED_PAGE.title,
        leftPercent: 71.4286,
        topPercent: 0,
        widthPercent: 14.2857,
        heightPercent: 100,
        targetKind: 'page',
        pageId: MIGRATED_PAGE.id,
        url: null,
        contentHtml: null,
      },
    ]);
    expect(sky!.skippedAreas).toBe(1);
  });

  it('registers only the pictures used inside the area content for copying', async () => {
    expect(await assets.copyReferenced()).toEqual({ copied: 1, missing: [] });
    expect(existsSync(join(uploadsDir, 'legacy/mapa/mapki/Koziorozec.png'))).toBe(true);
  });

  it('copies the teaser picture when the map has one', () => {
    const [sky, angelology] = prepared.maps;
    expect(sky!.teaserImage).toBe('maps/teasers/mapa-nieba.png');
    expect(existsSync(join(uploadsDir, 'maps/teasers/mapa-nieba.png'))).toBe(true);
    expect(angelology!.teaserImage).toBeNull();
  });

  it('builds a map from the sliced table stored in a legacy page and replaces that page body with a link', () => {
    const angelology = prepared.maps[1]!;
    expect(angelology).toMatchObject({
      image: 'maps/angelologia.webp',
      imageWidth: 12,
      imageHeight: 8,
      legacyPageId: 388,
    });
    expect(angelology.areas).toMatchObject([
      { label: MIGRATED_PAGE.title, targetKind: 'page', pageId: MIGRATED_PAGE.id, leftPercent: 0, widthPercent: 100 },
    ]);
    expect([...pageBodiesReplacedByMaps(prepared.maps)]).toEqual([
      [388, '<p>Tę stronę zastąpiła mapa interaktywna. <a href="/mapy/angelologia">Otwórz mapę „Angelologia”</a>.</p>'],
    ]);
  });
});

describe('resolveWithinFolder', () => {
  it('resolves relative addresses against the folder of the map', () => {
    expect(resolveWithinFolder('mapa', 'wieloryb.htm')).toBe('mapa/wieloryb.htm');
    expect(resolveWithinFolder('mapa', ' rycerze/89. Moses.jpg ')).toBe('mapa/rycerze/89. Moses.jpg');
    expect(resolveWithinFolder('kr', '../img/logo.png')).toBe('img/logo.png');
    expect(resolveWithinFolder('.', 'images/posejdon/MAPA_03.png')).toBe('images/posejdon/MAPA_03.png');
    expect(resolveWithinFolder('', 'images/posejdon/MAPA_03.png')).toBe('images/posejdon/MAPA_03.png');
  });

  it('keeps site-rooted and absolute addresses unchanged', () => {
    expect(resolveWithinFolder('kr', '/viewpage.php?page_id=30')).toBe('/viewpage.php?page_id=30');
    expect(resolveWithinFolder('kr', `${LEGACY_SITE}/news.php`)).toBe(`${LEGACY_SITE}/news.php`);
    expect(resolveWithinFolder('kr', '//example.com/a.png')).toBe('//example.com/a.png');
    expect(resolveWithinFolder('kr', 'mailto:a@example.com')).toBe('mailto:a@example.com');
    expect(resolveWithinFolder('kr', '#top')).toBe('#top');
    expect(resolveWithinFolder('kr', '  ')).toBe('');
  });
});

describe('labelFromHref', () => {
  it('makes a readable label out of the last part of an address', () => {
    expect(labelFromHref('CERBER')).toBe('Cerber');
    expect(labelFromHref('mapa/wielka-niedzwiedzica.htm')).toBe('Wielka niedzwiedzica');
    expect(labelFromHref('https://example.com/saint_seiya/lost+canvas.html?page=2#top')).toBe('Lost canvas');
    expect(labelFromHref('https://example.com/')).toBe('Example');
    expect(labelFromHref('')).toBe('');
  });
});
