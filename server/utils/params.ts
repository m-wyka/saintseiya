import type { H3Event } from 'h3';
import { z } from 'zod';

const identifierSchema = z.coerce.number().int().positive();
const pageQuerySchema = z.object({ page: pageNumberSchema });

export const requiredIdParam = (event: H3Event, name = 'id'): number => {
  const parsed = identifierSchema.safeParse(getRouterParam(event, name));
  if (!parsed.success) {
    throw createError({ statusCode: 404, statusMessage: 'ERRORS.NOT_FOUND' });
  }
  return parsed.data;
};

export const pageQuery = async (event: H3Event): Promise<number> =>
  (await getValidatedQuery(event, pageQuerySchema.parse)).page;

export const foundOr404 = <Value>(value: Value | null | undefined, message = 'ERRORS.NOT_FOUND'): Value => {
  if (value === null || value === undefined) {
    throw createError({ statusCode: 404, statusMessage: message });
  }
  return value;
};
