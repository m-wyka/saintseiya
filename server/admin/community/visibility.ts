import { eq } from 'drizzle-orm';
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';
import { z } from 'zod';

export const visibilityInputSchema = z.object({ isHidden: z.boolean('Podaj, czy wpis ma być ukryty') });

export const visibilityFilter = (hiddenFlag: SQLiteColumn, filter: string) => {
  if (filter === 'visible') {
    return eq(hiddenFlag, false);
  }
  if (filter === 'hidden') {
    return eq(hiddenFlag, true);
  }
  return undefined;
};
