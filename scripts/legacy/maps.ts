import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { dirname, extname, join, posix } from 'node:path';
import { escapeHtml } from '../../server/utils/html';
import type { RichHtmlRewriter } from '../../server/utils/html';
import { readImageSize, writeCompositeImage } from '../../server/utils/imageProcessing';
import type { ImagePart } from '../../server/utils/imageProcessing';
import type { MapAreaTarget } from '../../shared/utils/content';
import { LEGACY_MAP_SLUGS, parseLegacyUrl } from '../../shared/utils/legacyUrls';
import type { LegacyTarget } from '../../shared/utils/legacyUrls';
import { routes } from '../../shared/utils/routes';
import type { AssetRegistry } from './assets';
import { cleanLegacyHtml } from './html';
import type { PlannedPage } from './pageTree';
import type { ImportPlan } from './plan';
import type { LegacyData } from './read';
import type { LegacyRewriter } from './rewriter';
import { parseSlicedMap } from './slicedMap';
import type { SlicedMap, SlicedMapArea, SlicedMapSlice } from './slicedMap';
import { collapseWhitespace, stripLegacySlashes } from './text';

const MAPS_MEDIA_FOLDER = 'maps';
const MAP_TEASERS_MEDIA_FOLDER = `${MAPS_MEDIA_FOLDER}/teasers`;
const THEME_IMAGES_FOLDER = 'themes/saintseiya-g-angeltheme3/images';
const STANDALONE_HTML_ENCODING = 'windows-1250';
const PERCENT_DECIMALS = 4;

const SITE_ROOTED_URL_PATTERN = /^(?:[a-z][a-z0-9+.-]*:|\/|#)/i;
const POPUP_FILE_PATTERN = /\.html?$/i;
const DOCUMENT_BODY_PATTERN = /<body\b[^>]*>([\s\S]*)<\/body>/i;
const URL_SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:\/\//i;
const FILE_EXTENSION_PATTERN = /\.[a-z0-9]{2,5}$/i;

const LABELS_BY_TARGET_KIND: Partial<Record<LegacyTarget['kind'], string>> = {
  home: 'Strona główna',
  forumIndex: 'Forum',
  forum: 'Forum',
  thread: 'Forum',
  post: 'Forum',
  newsList: 'Newsy',
  news: 'Newsy',
  gallery: 'Galeria',
  album: 'Galeria',
};

interface LegacyMapSource {
  slug: string;
  title: string;
  htmlFile: string | null;
  legacyPageId: number | null;
  pageBackground: string;
  teaserFile: string | null;
  brokenLinkFixes: Map<string, string>;
}

const LEGACY_MAP_SOURCES: LegacyMapSource[] = [
  {
    slug: LEGACY_MAP_SLUGS.sky,
    title: 'Mapa Nieba',
    htmlFile: 'mapa/index.html',
    legacyPageId: null,
    pageBackground: '#000000',
    teaserFile: 'mapagwiazd.png',
    brokenLinkFixes: new Map(),
  },
  {
    slug: LEGACY_MAP_SLUGS.underworld,
    title: 'Królestwo Umarłych',
    htmlFile: 'kr/index.html',
    legacyPageId: null,
    pageBackground: '#000000',
    teaserFile: 'kp.png',
    brokenLinkFixes: new Map([
      ['2w', '/viewpage.php?page_id=480'],
      ['CERBER', '/viewpage.php?page_id=508'],
    ]),
  },
  {
    slug: LEGACY_MAP_SLUGS.poseidon,
    title: 'Królestwo Posejdona',
    htmlFile: 'posejdon.html',
    legacyPageId: null,
    pageBackground: '#ffffff',
    teaserFile: 'kpp.png',
    brokenLinkFixes: new Map(),
  },
  {
    slug: LEGACY_MAP_SLUGS.angelology,
    title: 'Angelologia',
    htmlFile: null,
    legacyPageId: 388,
    pageBackground: '#000000',
    teaserFile: null,
    brokenLinkFixes: new Map(),
  },
];

export interface MapImportContext {
  data: Pick<LegacyData, 'pages'>;
  plan: { pages: Pick<PlannedPage, 'legacyId' | 'title'>[]; ids: Pick<ImportPlan['ids'], 'pagesByLegacyId'> };
  rewriter: Pick<LegacyRewriter, 'link' | 'image'>;
  assets: Pick<AssetRegistry, 'exists' | 'sourceFile'>;
  report: { missingFiles: string[] };
}

interface AreaTarget {
  targetKind: MapAreaTarget;
  pageId: number | null;
  url: string | null;
  contentHtml: string | null;
}

export interface PreparedMapArea extends AreaTarget {
  label: string;
  leftPercent: number;
  topPercent: number;
  widthPercent: number;
  heightPercent: number;
}

export interface PreparedMap {
  slug: string;
  title: string;
  image: string;
  imageWidth: number;
  imageHeight: number;
  teaserImage: string | null;
  legacyPageId: number | null;
  areas: PreparedMapArea[];
  skippedAreas: number;
}

export interface PreparedMaps {
  maps: PreparedMap[];
  skippedMaps: number;
}

interface LabelledTarget {
  target: AreaTarget;
  fallbackLabel: string;
}

const standaloneHtmlDecoder = new TextDecoder(STANDALONE_HTML_ENCODING);

const readStandaloneHtml = async (file: string): Promise<string> => standaloneHtmlDecoder.decode(await readFile(file));

const folderOf = (source: LegacyMapSource): string => (source.htmlFile ? posix.dirname(source.htmlFile) : '');

export const resolveWithinFolder = (folder: string, url: string): string => {
  const trimmed = url.trim();
  return !trimmed || SITE_ROOTED_URL_PATTERN.test(trimmed) ? trimmed : posix.join(folder, trimmed);
};

const rewriterWithinFolder = (folder: string, rewriter: MapImportContext['rewriter']): RichHtmlRewriter => ({
  link: (href) => rewriter.link(resolveWithinFolder(folder, href)),
  image: (src) => rewriter.image(resolveWithinFolder(folder, src)),
});

const capitalize = (text: string): string =>
  text.charAt(0).toLocaleUpperCase('pl') + text.slice(1).toLocaleLowerCase('pl');

export const labelFromHref = (href: string): string => {
  const [location = ''] = href.trim().replace(URL_SCHEME_PATTERN, '').split(/[?#]/);
  const lastSegment = location.split('/').filter(Boolean).at(-1) ?? '';
  return capitalize(collapseWhitespace(lastSegment.replace(FILE_EXTENSION_PATTERN, '').replace(/[-_+.]+/g, ' ')));
};

const roundedPercent = (part: number, whole: number): number =>
  Number(((part / whole) * 100).toFixed(PERCENT_DECIMALS));

const documentBody = (html: string): string => DOCUMENT_BODY_PATTERN.exec(html)?.[1] ?? html;

const readSourceHtml = async (source: LegacyMapSource, { data, assets }: MapImportContext): Promise<string | null> => {
  if (source.htmlFile) {
    return (await assets.exists(source.htmlFile)) ? readStandaloneHtml(assets.sourceFile(source.htmlFile)) : null;
  }
  const page = data.pages.find((candidate) => candidate.id === source.legacyPageId);
  return page ? stripLegacySlashes(page.content) : null;
};

const legacyAssetPath = (folder: string, url: string): string | null => {
  const target = parseLegacyUrl(resolveWithinFolder(folder, url));
  return target?.kind === 'asset' ? target.path : null;
};

const locateSlices = async (
  slices: SlicedMapSlice[],
  folder: string,
  context: MapImportContext,
): Promise<ImagePart[]> => {
  const parts: ImagePart[] = [];
  for (const slice of slices) {
    const legacyPath = legacyAssetPath(folder, slice.src);
    const file = legacyPath ? context.assets.sourceFile(legacyPath) : null;
    if (file && (await readImageSize(file))) {
      parts.push({ file, left: slice.x, top: slice.y, width: slice.width, height: slice.height });
    } else {
      context.report.missingFiles.push(legacyPath ?? slice.src);
    }
  }
  return parts;
};

const pageTarget = (legacyPageId: number, { plan }: MapImportContext): LabelledTarget | null => {
  const pageId = plan.ids.pagesByLegacyId.get(legacyPageId);
  if (pageId === undefined) {
    return null;
  }
  return {
    target: { targetKind: 'page', pageId, url: null, contentHtml: null },
    fallbackLabel: plan.pages.find((page) => page.legacyId === legacyPageId)?.title ?? '',
  };
};

const popupTarget = async (legacyPath: string, context: MapImportContext): Promise<LabelledTarget | null> => {
  if (!(await context.assets.exists(legacyPath))) {
    context.report.missingFiles.push(legacyPath);
    return null;
  }
  const html = await readStandaloneHtml(context.assets.sourceFile(legacyPath));
  const rewriter = rewriterWithinFolder(posix.dirname(legacyPath), context.rewriter);
  return {
    target: {
      targetKind: 'content',
      pageId: null,
      url: null,
      contentHtml: cleanLegacyHtml(documentBody(html), rewriter),
    },
    fallbackLabel: '',
  };
};

const urlTarget = (
  url: string,
  legacyTarget: LegacyTarget | null,
  { rewriter }: MapImportContext,
): LabelledTarget | null => {
  const rewritten = rewriter.link(url);
  if (!rewritten) {
    return null;
  }
  return {
    target: { targetKind: 'url', pageId: null, url: rewritten, contentHtml: null },
    fallbackLabel: (legacyTarget && LABELS_BY_TARGET_KIND[legacyTarget.kind]) ?? '',
  };
};

const areaTarget = async (
  href: string,
  source: LegacyMapSource,
  context: MapImportContext,
): Promise<LabelledTarget | null> => {
  const url = resolveWithinFolder(folderOf(source), source.brokenLinkFixes.get(href) ?? href);
  const legacyTarget = parseLegacyUrl(url);
  if (legacyTarget?.kind === 'page') {
    return pageTarget(legacyTarget.legacyId, context);
  }
  if (legacyTarget?.kind === 'asset' && POPUP_FILE_PATTERN.test(legacyTarget.path)) {
    return popupTarget(legacyTarget.path, context);
  }
  return urlTarget(url, legacyTarget, context);
};

const areaPlacement = (area: SlicedMapArea, layout: SlicedMap) => ({
  leftPercent: roundedPercent(area.x, layout.width),
  topPercent: roundedPercent(area.y, layout.height),
  widthPercent: roundedPercent(area.width, layout.width),
  heightPercent: roundedPercent(area.height, layout.height),
});

const prepareAreas = async (
  layout: SlicedMap,
  source: LegacyMapSource,
  context: MapImportContext,
): Promise<PreparedMapArea[]> => {
  const prepared: PreparedMapArea[] = [];
  for (const area of layout.areas) {
    const labelled = await areaTarget(area.href, source, context);
    if (labelled) {
      prepared.push({
        ...labelled.target,
        ...areaPlacement(area, layout),
        label: area.label || labelled.fallbackLabel || labelFromHref(area.href) || source.title,
      });
    }
  }
  return prepared;
};

const copyTeaser = async (
  source: LegacyMapSource,
  context: MapImportContext,
  uploadsDir: string,
): Promise<string | null> => {
  if (!source.teaserFile) {
    return null;
  }
  const legacyPath = `${THEME_IMAGES_FOLDER}/${source.teaserFile}`;
  if (!(await context.assets.exists(legacyPath))) {
    context.report.missingFiles.push(legacyPath);
    return null;
  }
  const teaserImage = `${MAP_TEASERS_MEDIA_FOLDER}/${source.slug}${extname(source.teaserFile)}`;
  const destination = join(uploadsDir, teaserImage);
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(context.assets.sourceFile(legacyPath), destination);
  return teaserImage;
};

const prepareMap = async (
  source: LegacyMapSource,
  context: MapImportContext,
  uploadsDir: string,
): Promise<PreparedMap | null> => {
  const html = await readSourceHtml(source, context);
  if (html === null) {
    context.report.missingFiles.push(source.htmlFile ?? `viewpage.php?page_id=${source.legacyPageId}`);
    return null;
  }
  const layout = parseSlicedMap(html);
  const parts = await locateSlices(layout.slices, folderOf(source), context);
  if (!parts.length) {
    return null;
  }
  const image = `${MAPS_MEDIA_FOLDER}/${source.slug}.webp`;
  const { width, height } = await writeCompositeImage(parts, layout, source.pageBackground, join(uploadsDir, image));
  const areas = await prepareAreas(layout, source, context);
  return {
    slug: source.slug,
    title: source.title,
    image,
    imageWidth: width,
    imageHeight: height,
    teaserImage: await copyTeaser(source, context, uploadsDir),
    legacyPageId: source.legacyPageId,
    areas,
    skippedAreas: layout.areas.length - areas.length,
  };
};

export const prepareMaps = async (context: MapImportContext, uploadsDir: string): Promise<PreparedMaps> => {
  const maps: PreparedMap[] = [];
  for (const source of LEGACY_MAP_SOURCES) {
    const map = await prepareMap(source, context, uploadsDir);
    if (map) {
      maps.push(map);
    }
  }
  return { maps, skippedMaps: LEGACY_MAP_SOURCES.length - maps.length };
};

const mapLinkParagraph = (map: PreparedMap): string =>
  `<p>Tę stronę zastąpiła mapa interaktywna. <a href="${routes.map(map.slug)}">Otwórz mapę „${escapeHtml(map.title)}”</a>.</p>`;

export const pageBodiesReplacedByMaps = (maps: PreparedMap[]): Map<number, string> =>
  new Map(
    maps.flatMap((map) => (map.legacyPageId === null ? [] : [[map.legacyPageId, mapLinkParagraph(map)] as const])),
  );
