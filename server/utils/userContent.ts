import { z } from 'zod';

const MAX_HTML_LENGTH = 60_000;
const MAX_SHOUT_LENGTH = 300;
const WEB_URL_PATTERN = /^https?:\/\//i;
const SAFE_LINK_PATTERN = /^(?:https?:\/\/|mailto:|\/(?!\/)|#)/i;
const EMBEDDED_MEDIA_PATTERN = /<(?:img|iframe)\b/i;

export const richBodySchema = z.string().max(MAX_HTML_LENGTH, 'VALIDATION.CONTENT_TOO_LONG');
export const captchaTokenSchema = z.string().max(4096).optional();
export const shoutMessageSchema = z.string().trim().min(1, 'VALIDATION.SHOUT_EMPTY').max(MAX_SHOUT_LENGTH);

const userContentRewriter = {
  link: (href: string) => (SAFE_LINK_PATTERN.test(href) ? href : null),
  image: (src: string) => (WEB_URL_PATTERN.test(src) || src.startsWith('/media/') ? src : null),
};

export const cleanUserHtml = (html: string): string => {
  const cleaned = sanitizeRichHtml(html, userContentRewriter);
  if (!htmlToPlainText(cleaned) && !EMBEDDED_MEDIA_PATTERN.test(cleaned)) {
    throw createError({ statusCode: 400, statusMessage: 'ERRORS.CONTENT_EMPTY' });
  }
  return cleaned;
};

export const cleanEditorHtml = (html: string): string => sanitizeRichHtml(html, userContentRewriter);

export const shoutToHtml = (message: string): string => escapeHtml(message).replace(/\r\n|\r|\n/g, '<br />');
