import { z } from 'zod';

const MAX_PAGE_NUMBER = 100_000;

export const pageNumberSchema = z.coerce.number().int().min(1).max(MAX_PAGE_NUMBER).default(1);

export interface Paginated<Item> {
  items: Item[];
  page: number;
  pageCount: number;
  total: number;
}

export const pageOffset = (page: number, pageSize: number): number => (page - 1) * pageSize;

export const paginated = <Item>(items: Item[], total: number, page: number, pageSize: number): Paginated<Item> => ({
  items,
  page,
  pageCount: Math.max(1, Math.ceil(total / pageSize)),
  total,
});
