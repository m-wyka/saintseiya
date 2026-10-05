import { z } from 'zod';
import { messageKey } from '#shared/utils/messages';

const MAX_SORT_ORDER = 9999;
const INVALID_SORT_ORDER = messageKey('VALIDATION.SORT_ORDER_INVALID', { max: MAX_SORT_ORDER });

export const forumSortOrderSchema = z
  .number(INVALID_SORT_ORDER)
  .int(INVALID_SORT_ORDER)
  .min(0, INVALID_SORT_ORDER)
  .max(MAX_SORT_ORDER, INVALID_SORT_ORDER)
  .default(0);
