const SUBHEADING_CLASS = 'subheading';
const SLICED_IMAGE_CLASS = 'sliced-image';
const IMAGE_GRID_CLASS = 'image-grid';
const SUBHEADING_LENGTH = { min: 3, max: 80 };
const FEWEST_GRID_IMAGES = 2;

// Stored content has no classes (the sanitizer drops them), so these patterns can rely on bare tags.
const BOLD_PARAGRAPH_PATTERN =
  /<p(\s[^>]*)?>(\s*(?:<span\b[^>]*>\s*)?<(strong|b)>((?:(?!<\/?(?:strong|b|p|img|br)\b)[\s\S])+?)<\/\3>\s*(?:<\/span>\s*)?)<\/p>/g;
const LINKED_IMAGES_PARAGRAPH_PATTERN = /<p(\s[^>]*)?>((?:\s|&nbsp;|<br \/>|<a\b[^>]*>\s*<img\b[^>]*>\s*<\/a>)+)<\/p>/g;
const INNERMOST_TABLE_PATTERN = /<table(\s[^>]*)?>((?:(?!<table\b)[\s\S])*?)<\/table>/g;
const CELL_PATTERN = /<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/g;
const IMAGE_PATTERN = /<img\b/g;

const visibleText = (html: string): string =>
  html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();

const imageCount = (html: string): number => html.match(IMAGE_PATTERN)?.length ?? 0;

const withClass = (tag: string, className: string, attributes = '', content: string): string =>
  `<${tag} class="${className}"${attributes}>${content}</${tag}>`;

// Legacy editors wrote a heading as a paragraph holding one bold phrase.
const markSubheadings = (html: string): string =>
  html.replace(BOLD_PARAGRAPH_PATTERN, (paragraph, attributes: string | undefined, content: string) => {
    const text = visibleText(content);
    const readsAsHeading =
      text.length >= SUBHEADING_LENGTH.min && text.length <= SUBHEADING_LENGTH.max && /\p{L}/u.test(text);
    return readsAsHeading ? withClass('p', SUBHEADING_CLASS, attributes, content) : paragraph;
  });

const markLinkedImageRows = (html: string): string =>
  html.replace(LINKED_IMAGES_PARAGRAPH_PATTERN, (paragraph, attributes: string | undefined, content: string) =>
    imageCount(content) >= FEWEST_GRID_IMAGES ? withClass('p', IMAGE_GRID_CLASS, attributes, content) : paragraph,
  );

// A table without any text is either one picture cut into cells or rows of picture tiles.
const markImageTables = (html: string): string =>
  html.replace(INNERMOST_TABLE_PATTERN, (table, attributes: string | undefined, content: string) => {
    const cells = [...content.matchAll(CELL_PATTERN)].map(([, cell = '']) => cell);
    const imagesPerCell = cells.map(imageCount);
    const imagesInTable = imagesPerCell.reduce((sum, count) => sum + count, 0);
    if (imagesInTable < FEWEST_GRID_IMAGES || cells.some((cell) => visibleText(cell))) {
      return table;
    }
    const className = Math.max(...imagesPerCell) > 1 ? IMAGE_GRID_CLASS : SLICED_IMAGE_CLASS;
    return withClass('table', className, attributes, content);
  });

export const markLayoutHints = (html: string): string =>
  html.includes('<') ? markImageTables(markLinkedImageRows(markSubheadings(html))) : html;
