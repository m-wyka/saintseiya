import sanitizeHtml from 'sanitize-html';
import type { Attributes, IOptions, Tag } from 'sanitize-html';

const YOUTUBE_EMBED_BASE_URL = 'https://www.youtube-nocookie.com/embed';
const YOUTUBE_ID_PATTERN = /(?:youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?(?:.*&)?v=)|youtu\.be\/)([\w-]{11})/i;
const HEX_COLOR_PATTERN = /^#(?:[0-9a-f]{3}){1,2}$/i;
const VISIBLE_HEX_COLOR_PATTERN = /^#(?!f{3}(?:f{3})?$)(?:[0-9a-f]{3}){1,2}$/i;
const INTERNAL_URL_PATTERN = /^\/(?!\/)/;

export interface RichHtmlRewriter {
  link?: (href: string) => string | null;
  image?: (src: string) => string | null;
}

const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export const escapeHtml = (text: string): string => text.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character]!);

export const youtubeIdFromUrl = (url: string): string | null => YOUTUBE_ID_PATTERN.exec(url)?.[1] ?? null;

export const youtubeEmbedUrl = (youtubeId: string): string => `${YOUTUBE_EMBED_BASE_URL}/${youtubeId}`;

const rename = (tagName: string, attribs: Attributes = {}): Tag => ({ tagName, attribs });

const withoutEmptyValues = (attribs: Record<string, string | undefined>): Attributes =>
  Object.fromEntries(Object.entries(attribs).filter((entry): entry is [string, string] => Boolean(entry[1])));

const linkTransformer = (rewriter: RichHtmlRewriter) => (_tagName: string, attribs: Attributes) => {
  const original = attribs.href?.trim() ?? '';
  const href = rewriter.link ? rewriter.link(original) : original;
  if (!href) {
    return rename('span');
  }
  if (INTERNAL_URL_PATTERN.test(href) || href.startsWith('#')) {
    return rename('a', withoutEmptyValues({ href, title: attribs.title }));
  }
  return rename('a', withoutEmptyValues({ href, title: attribs.title, target: '_blank', rel: 'noopener nofollow' }));
};

const imageTransformer = (rewriter: RichHtmlRewriter) => (_tagName: string, attribs: Attributes) => {
  const original = attribs.src?.trim() ?? '';
  const src = rewriter.image ? rewriter.image(original) : original;
  if (!src) {
    return rename('span');
  }
  return rename('img', {
    src,
    alt: attribs.alt ?? '',
    ...withoutEmptyValues({ title: attribs.title, width: attribs.width, height: attribs.height, style: attribs.style }),
    loading: 'lazy',
  });
};

const iframeTransformer = (_tagName: string, attribs: Attributes) => {
  const youtubeId = youtubeIdFromUrl(attribs.src ?? '');
  if (!youtubeId) {
    return rename('span');
  }
  return rename('iframe', {
    src: youtubeEmbedUrl(youtubeId),
    title: attribs.title || 'Film YouTube',
    loading: 'lazy',
    allowfullscreen: '',
  });
};

const fontTransformer = (_tagName: string, attribs: Attributes) =>
  HEX_COLOR_PATTERN.test(attribs.color ?? '') ? rename('span', { style: `color:${attribs.color}` }) : rename('span');

const buildOptions = (rewriter: RichHtmlRewriter): IOptions => ({
  allowedTags: [
    'p',
    'br',
    'hr',
    'strong',
    'em',
    'u',
    's',
    'sub',
    'sup',
    'small',
    'span',
    'div',
    'a',
    'img',
    'ul',
    'ol',
    'li',
    'table',
    'thead',
    'tbody',
    'tfoot',
    'tr',
    'td',
    'th',
    'caption',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'blockquote',
    'pre',
    'code',
    'iframe',
    'details',
    'summary',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'style'],
    iframe: ['src', 'title', 'loading', 'allowfullscreen'],
    td: ['colspan', 'rowspan', 'style'],
    th: ['colspan', 'rowspan', 'style'],
    p: ['style'],
    div: ['style'],
    span: ['style'],
    h2: ['style'],
    h3: ['style'],
    h4: ['style'],
    h5: ['style'],
    h6: ['style'],
  },
  allowedStyles: {
    '*': {
      'text-align': [/^(?:left|right|center)$/i],
      color: [VISIBLE_HEX_COLOR_PATTERN],
    },
    img: {
      float: [/^(?:left|right)$/i],
    },
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: { img: ['http', 'https'], iframe: ['https'] },
  allowProtocolRelative: false,
  allowedIframeHostnames: ['www.youtube-nocookie.com'],
  transformTags: {
    a: linkTransformer(rewriter),
    img: imageTransformer(rewriter),
    iframe: iframeTransformer,
    font: fontTransformer,
    center: () => rename('div', { style: 'text-align:center' }),
    b: 'strong',
    i: 'em',
    strike: 's',
    h1: 'h2',
  },
});

const SPAN_TAG_PATTERN = /<span\b([^>]*)>|<\/span>/gi;

const unwrapBareSpans = (html: string): string => {
  const keptSpans: boolean[] = [];
  return html.replace(SPAN_TAG_PATTERN, (tag, attributes: string | undefined) => {
    if (tag.startsWith('</')) {
      return keptSpans.pop() ? tag : '';
    }
    const isKept = Boolean(attributes?.trim());
    keptSpans.push(isKept);
    return isKept ? tag : '';
  });
};

export const sanitizeRichHtml = (html: string, rewriter: RichHtmlRewriter = {}): string =>
  unwrapBareSpans(sanitizeHtml(html, buildOptions(rewriter))).trim();

const TEXT_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
};
const TEXT_ENTITY_PATTERN = /&(?:amp|lt|gt|quot|#39|nbsp);/g;
const LINE_BREAKING_TAG_PATTERN =
  /<\/?(?:br|p|div|li|tr|td|th|h[1-6]|blockquote|pre|hr|summary|details|figcaption)\b[^>]*>/gi;

const decodeTextEntities = (text: string): string =>
  text.replace(TEXT_ENTITY_PATTERN, (entity) => TEXT_ENTITIES[entity]!);

export const sanitizedHtmlToText = (html: string): string =>
  decodeTextEntities(html.replace(LINE_BREAKING_TAG_PATTERN, ' ').replace(/<[^>]*>/g, ''))
    .replace(/\s+/g, ' ')
    .trim();

export const truncateAtWord = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : maxLength).replace(/[\s.,;:!?–-]+$/, '')}…`;
};

export const htmlToPlainText = (html: string): string =>
  decodeTextEntities(
    sanitizeHtml(html.replace(LINE_BREAKING_TAG_PATTERN, ' $&'), { allowedTags: [], allowedAttributes: {} }),
  )
    .replace(/\s+/g, ' ')
    .trim();
