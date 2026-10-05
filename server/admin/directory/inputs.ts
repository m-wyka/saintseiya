import { z } from 'zod';
import { messageKey } from '#shared/utils/messages';

const INTERNAL_URL_PATTERN = /^\/(?![/\\])/;
const MAX_SORT_ORDER = 9999;
const INVALID_SORT_ORDER = messageKey('VALIDATION.SORT_ORDER_INVALID', { max: MAX_SORT_ORDER });

export const isWebUrl = (url: string): boolean => z.httpUrl().safeParse(url).success;

export const isInternalUrl = (url: string): boolean => INTERNAL_URL_PATTERN.test(url);

export const sortOrderSchema = z
  .number(INVALID_SORT_ORDER)
  .int(INVALID_SORT_ORDER)
  .min(0, INVALID_SORT_ORDER)
  .max(MAX_SORT_ORDER, INVALID_SORT_ORDER)
  .default(0);

export const existingIdSchema = (exists: (id: number) => boolean, message: string) =>
  z.number(message).refine(exists, message);
