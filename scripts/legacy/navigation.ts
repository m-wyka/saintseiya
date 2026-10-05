import { htmlToPlainText } from '../../server/utils/html';
import { collapseWhitespace } from './text';

const SEPARATOR_URL = '---';
const HEADER_IMAGE_PATTERN = /<img[^>]+src=['"][^'"]*\/([a-z0-9_-]+)\.(?:jpg|png|gif)['"]/i;
const HIDDEN_VISIBILITY = 103;
const MAIN_SECTION_TITLE = 'Menu główne';
const FAN_SECTION_TITLE = 'Fans';
const PAGE_ID_PATTERN = /viewpage\.php\?page_id=(\d+)/;
const FAN_ART_TITLE_PATTERN = /^fan\s*-?\s*arty\b/i;

const SECTION_HEADERS: Record<string, string> = {
  informacje: 'Informacje',
  multimedia: 'Multimedia',
  galeria: 'Galeria',
  fans: FAN_SECTION_TITLE,
  partnerzy: 'Partnerzy',
};

const GROUP_HEADERS: Record<string, string> = {
  ss: 'Saint Seiya',
  lc: 'Lost Canvas',
  omega: 'Omega',
  inne: 'Inne',
  mitologia: 'Mitologia',
  astronomia: 'Astronomia',
};

export interface LegacySiteLink {
  name: string;
  url: string;
  visibility: number;
}

export interface PlannedNavigationLink {
  groupTitle: string | null;
  label: string;
  legacyUrl: string;
}

export interface PlannedNavigationSection {
  title: string;
  links: PlannedNavigationLink[];
}

const headerImageName = (link: LegacySiteLink): string | null =>
  link.url.trim() === SEPARATOR_URL ? (HEADER_IMAGE_PATTERN.exec(link.name)?.[1]?.toLowerCase() ?? null) : null;

const linkLabel = (name: string): string =>
  collapseWhitespace(htmlToPlainText(name.replace(/<br\s*\/?>/gi, ' ')).replace(/"/g, ''));

export const linkedPageId = (legacyUrl: string): number | null => {
  const id = Number(PAGE_ID_PATTERN.exec(legacyUrl)?.[1]);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const pointsToReusedPage = (sectionTitle: string, pageTitle: string): boolean =>
  FAN_ART_TITLE_PATTERN.test(pageTitle.trim()) && sectionTitle !== FAN_SECTION_TITLE;

export const planNavigation = (
  siteLinks: LegacySiteLink[],
  linkablePageTitles: Map<number, string>,
): PlannedNavigationSection[] => {
  const sections: PlannedNavigationSection[] = [{ title: MAIN_SECTION_TITLE, links: [] }];
  let groupTitle: string | null = null;
  const leadsNowhere = (sectionTitle: string, legacyUrl: string): boolean => {
    const pageId = linkedPageId(legacyUrl);
    if (pageId === null) {
      return false;
    }
    const pageTitle = linkablePageTitles.get(pageId);
    return pageTitle === undefined || pointsToReusedPage(sectionTitle, pageTitle);
  };

  for (const siteLink of siteLinks) {
    const header = headerImageName(siteLink);
    if (header && SECTION_HEADERS[header]) {
      sections.push({ title: SECTION_HEADERS[header], links: [] });
      groupTitle = null;
      continue;
    }
    if (header && GROUP_HEADERS[header]) {
      groupTitle = GROUP_HEADERS[header];
      continue;
    }
    const section = sections[sections.length - 1]!;
    const legacyUrl = siteLink.url.trim();
    if (
      legacyUrl === SEPARATOR_URL ||
      siteLink.visibility >= HIDDEN_VISIBILITY ||
      leadsNowhere(section.title, legacyUrl)
    ) {
      continue;
    }
    section.links.push({ groupTitle, label: linkLabel(siteLink.name), legacyUrl });
  }
  return sections.filter((section) => section.links.length > 0);
};
