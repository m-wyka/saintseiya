import type { ZodType } from 'zod';
import { z } from 'zod';
import { MOVE_DIRECTIONS } from '#shared/utils/ordering';
import type { AdminAccess } from '#shared/utils/roles';
import type { Account } from './accounts';

const BAD_REQUEST = 400;
const CONFLICT = 409;
const INVALID_INPUT_MESSAGE = 'Nieprawidłowe dane';

export const adminListQuerySchema = z.object({
  page: pageNumberSchema,
  search: z.string().trim().max(120).default(''),
  filter: z.string().trim().max(60).default(''),
});

export type AdminListQuery = z.infer<typeof adminListQuerySchema>;

export const moveInputSchema = z.object({ direction: z.enum(MOVE_DIRECTIONS) });

interface AdminResourceDefinition<Input> {
  access: AdminAccess;
  inputSchema: ZodType<Input>;
  list: (query: AdminListQuery) => unknown;
  find: (id: number) => unknown;
  create: (input: Input, actor: Account) => { id: number };
  update: (id: number, input: Input, actor: Account) => void;
  remove: (id: number, actor: Account) => void;
}

export interface AdminResource {
  access: AdminAccess;
  list: (query: AdminListQuery) => unknown;
  find: (id: number) => unknown;
  create: (rawInput: unknown, actor: Account) => { id: number };
  update: (id: number, rawInput: unknown, actor: Account) => void;
  remove: (id: number, actor: Account) => void;
}

export const parseInput = <Input>(inputSchema: ZodType<Input>, rawInput: unknown): Input => {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw createError({
      statusCode: BAD_REQUEST,
      statusMessage: parsed.error.issues[0]?.message ?? INVALID_INPUT_MESSAGE,
      data: { issues: parsed.error.issues },
    });
  }
  return parsed.data;
};

export const defineAdminResource = <Input>(definition: AdminResourceDefinition<Input>): AdminResource => ({
  access: definition.access,
  list: definition.list,
  find: definition.find,
  create: (rawInput, actor) => definition.create(parseInput(definition.inputSchema, rawInput), actor),
  update: (id, rawInput, actor) => definition.update(id, parseInput(definition.inputSchema, rawInput), actor),
  remove: definition.remove,
});

export const adminSlug = (
  wanted: string,
  title: string,
  isTaken: (slug: string) => boolean,
  fallback: string,
): string => uniqueSlug(wanted.trim() || title, isTaken, fallback);

export const slugInputSchema = z
  .string()
  .trim()
  .max(120)
  .regex(/^[a-z0-9-]*$/, 'Adres może zawierać małe litery, cyfry i myślniki')
  .default('');

export const conflict = (message: string) => createError({ statusCode: CONFLICT, statusMessage: message });
