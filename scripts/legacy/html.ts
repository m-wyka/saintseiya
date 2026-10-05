import { sanitizeRichHtml, youtubeEmbedUrl, youtubeIdFromUrl } from '../../server/utils/html';
import type { RichHtmlRewriter } from '../../server/utils/html';
import { bbcodeToHtml } from './bbcode';
import type { BbcodeOptions } from './bbcode';
import { stripLegacySlashes } from './text';

const FLASH_EMBED_PATTERN = /<object\b[\s\S]*?<\/object>|<embed\b[^>]*>(?:\s*<\/embed>)?/gi;
const EMPTY_PARAGRAPH_RUN_PATTERN = /(?:<p(?: style="[^"]*")?>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>\s*){2,}/gi;
const LEADING_BLANK_PATTERN = /^(?:\s|<p(?: style="[^"]*")?>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>|<br\s*\/?>)+/i;
const TRAILING_BLANK_PATTERN = /(?:\s|<p(?: style="[^"]*")?>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>|<br\s*\/?>)+$/i;

const flashEmbedToIframe = (embed: string): string => {
  const youtubeId = youtubeIdFromUrl(embed);
  return youtubeId ? `<iframe src="${youtubeEmbedUrl(youtubeId)}"></iframe>` : '';
};

const tidyBlankParagraphs = (html: string): string =>
  html
    .replace(LEADING_BLANK_PATTERN, '')
    .replace(TRAILING_BLANK_PATTERN, '')
    .replace(EMPTY_PARAGRAPH_RUN_PATTERN, '<p>&nbsp;</p>');

export const lineBreaksToHtml = (text: string): string => text.replace(/\r\n|\r|\n/g, '<br>\n');

export const cleanLegacyHtml = (html: string, rewriter: RichHtmlRewriter): string =>
  tidyBlankParagraphs(sanitizeRichHtml(html.replace(FLASH_EMBED_PATTERN, flashEmbedToIframe), rewriter));

export const convertLegacyHtml = (storedHtml: string, rewriter: RichHtmlRewriter): string =>
  cleanLegacyHtml(stripLegacySlashes(storedHtml), rewriter);

export const convertLegacyBbcode = (
  storedText: string,
  rewriter: RichHtmlRewriter,
  options: BbcodeOptions = {},
): string => sanitizeRichHtml(bbcodeToHtml(storedText, options), rewriter);
