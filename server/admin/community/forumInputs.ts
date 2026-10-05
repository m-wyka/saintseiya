import { z } from 'zod';

const MAX_SORT_ORDER = 9999;
const INVALID_SORT_ORDER = `Kolejność to liczba całkowita od 0 do ${MAX_SORT_ORDER}`;

export const forumSortOrderSchema = z
  .number(INVALID_SORT_ORDER)
  .int(INVALID_SORT_ORDER)
  .min(0, INVALID_SORT_ORDER)
  .max(MAX_SORT_ORDER, INVALID_SORT_ORDER)
  .default(0);
