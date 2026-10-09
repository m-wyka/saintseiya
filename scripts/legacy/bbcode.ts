import { escapeHtml } from '../../server/utils/html';
import { replaceSmileys } from '../../server/utils/smileys';
import { decodeTextEntities } from './text';

const TAG_PATTERN = /\[(\/?)([a-z]+)(?:=([^\]\r\n]*))?\]/gi;
const CONTAINER_TAGS = new Set(['b', 'i', 'u', 'small', 'center', 'quote', 'url', 'mail', 'color', 'size', 'spoiler']);
const RAW_CONTENT_TAGS = new Set(['code', 'img']);
const SAFE_LINK_PATTERN = /^(?:https?:\/\/|ftp:\/\/)/i;
const HEX_COLOR_PATTERN = /^#(?:[0-9a-f]{3}){1,2}$/i;
const EMAIL_PATTERN = /^[^\s@<>"']+@[^\s@<>"']+\.[a-z]{2,}$/i;

interface BbElement {
  tag: string;
  argument: string | null;
  source: string;
  children: BbNode[];
}
type BbNode = string | BbElement;

const escapeAngleBrackets = (text: string): string => text.replace(/</g, '&lt;').replace(/>/g, '&gt;');

const lineBreaksToTags = (text: string): string => text.replace(/\r\n|\r|\n/g, '<br>');

const plainText = (nodes: BbNode[]): string =>
  nodes.map((node) => (typeof node === 'string' ? node : plainText(node.children))).join('');

type TextRenderer = (text: string) => string;

const renderNodes = (nodes: BbNode[], renderText: TextRenderer): string =>
  nodes.map((node) => (typeof node === 'string' ? renderText(node) : renderElement(node, renderText))).join('');

const normalizeLink = (rawUrl: string): string | null => {
  const url = decodeTextEntities(rawUrl).trim();
  if (!url || /^[a-z][a-z0-9+.-]*:/i.test(url)) {
    return SAFE_LINK_PATTERN.test(url) ? url : null;
  }
  return url.startsWith('www.') ? `http://${url}` : url;
};

const renderLink = (element: BbElement, renderText: TextRenderer): string => {
  const href = normalizeLink(element.argument ?? plainText(element.children));
  const label = renderNodes(element.children, renderText);
  return href ? `<a href="${escapeHtml(href)}">${label}</a>` : label;
};

const renderMail = (element: BbElement, renderText: TextRenderer): string => {
  const address = decodeTextEntities(element.argument ?? plainText(element.children)).trim();
  const label = renderNodes(element.children, renderText);
  return EMAIL_PATTERN.test(address) ? `<a href="mailto:${escapeHtml(address)}">${label}</a>` : label;
};

const renderImage = (element: BbElement): string => {
  const src = normalizeLink(plainText(element.children));
  return src ? `<img src="${escapeHtml(src)}" alt="">` : escapeHtml(decodeTextEntities(element.source));
};

const renderColor = (element: BbElement, renderText: TextRenderer): string => {
  const color = element.argument?.trim() ?? '';
  const content = renderNodes(element.children, renderText);
  return HEX_COLOR_PATTERN.test(color) ? `<span style="color:${color}">${content}</span>` : content;
};

const ELEMENT_RENDERERS: Record<string, (element: BbElement, renderText: TextRenderer) => string> = {
  b: (element, renderText) => `<strong>${renderNodes(element.children, renderText)}</strong>`,
  i: (element, renderText) => `<em>${renderNodes(element.children, renderText)}</em>`,
  u: (element, renderText) => `<u>${renderNodes(element.children, renderText)}</u>`,
  small: (element, renderText) => `<small>${renderNodes(element.children, renderText)}</small>`,
  center: (element, renderText) => `<div style="text-align:center">${renderNodes(element.children, renderText)}</div>`,
  quote: (element, renderText) => `<blockquote>${renderNodes(element.children, renderText)}</blockquote>`,
  spoiler: (element, renderText) =>
    `<details><summary>Spoiler</summary>${renderNodes(element.children, renderText)}</details>`,
  size: (element, renderText) => renderNodes(element.children, renderText),
  code: (element) => `<pre><code>${escapeAngleBrackets(plainText(element.children))}</code></pre>`,
  url: renderLink,
  mail: renderMail,
  img: renderImage,
  color: renderColor,
};

const renderElement = (element: BbElement, renderText: TextRenderer): string =>
  ELEMENT_RENDERERS[element.tag]!(element, renderText);

const parse = (text: string): BbNode[] => {
  const root: BbElement = { tag: 'root', argument: null, source: '', children: [] };
  const openElements: BbElement[] = [root];
  const current = () => openElements[openElements.length - 1]!;
  const appendText = (value: string) => {
    if (value) {
      current().children.push(value);
    }
  };
  const abandonUnclosed = (untilDepth: number) => {
    while (openElements.length > untilDepth) {
      const unclosed = openElements.pop()!;
      current().children.push(unclosed.source, ...unclosed.children);
    }
  };

  const pattern = new RegExp(TAG_PATTERN);
  let cursor = 0;
  for (let match = pattern.exec(text); match; match = pattern.exec(text)) {
    const [source, slash, rawTag, argument = null] = match;
    const tag = rawTag!.toLowerCase();
    appendText(text.slice(cursor, match.index));
    cursor = pattern.lastIndex;

    if (!slash && RAW_CONTENT_TAGS.has(tag)) {
      const closingTag = `[/${tag}]`;
      const closingIndex = text.toLowerCase().indexOf(closingTag, cursor);
      if (closingIndex === -1) {
        appendText(source);
        continue;
      }
      const content = text.slice(cursor, closingIndex);
      current().children.push({ tag, argument, source: `${source}${content}${closingTag}`, children: [content] });
      cursor = closingIndex + closingTag.length;
      pattern.lastIndex = cursor;
      continue;
    }

    if (!CONTAINER_TAGS.has(tag)) {
      appendText(source);
      continue;
    }

    if (!slash) {
      openElements.push({ tag, argument, source, children: [] });
      continue;
    }

    const openIndex = openElements.findLastIndex((element) => element.tag === tag);
    if (openIndex <= 0) {
      appendText(source);
      continue;
    }
    abandonUnclosed(openIndex + 1);
    const closed = openElements.pop()!;
    current().children.push(closed);
  }
  appendText(text.slice(cursor));
  abandonUnclosed(1);
  return root.children;
};

export interface BbcodeOptions {
  smileys?: boolean;
}

export const bbcodeToHtml = (text: string, { smileys = true }: BbcodeOptions = {}): string => {
  const renderText: TextRenderer = (value) => {
    const escaped = escapeAngleBrackets(value);
    return lineBreaksToTags(smileys ? replaceSmileys(escaped) : escaped);
  };
  return renderNodes(parse(text.trim()), renderText);
};
