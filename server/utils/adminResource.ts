import type { ZodType } from 'zod';
import { z } from 'zod';
import { MOVE_DIRECTIONS } from '#shared/utils/ordering';
import type { ContentLocale } from '#shared/utils/locales';
import { DEFAULT_LOCALE } from '#shared/utils/locales';
import type { AdminAccess } from '#shared/utils/roles';
import type { Account } from './accounts';
import type { TranslationSource } from './translations';
import { baseValuesOf, pruneTranslations, storeTranslations, withTranslations } from './translations';

const BAD_REQUEST = 400;
const CONFLICT = 409;
const INVALID_INPUT_MESSAGE = 'ERRORS.INVALID_INPUT';

export const adminListQuerySchema = z.object({
  page: pageNumberSchema,
  search: z.string().trim().max(120).default(''),
  filter: z.string().trim().max(60).default(''),
});

export type AdminListQuery = z.infer<typeof adminListQuerySchema>;

export const moveInputSchema = z.object({ direction: z.enum(MOVE_DIRECTIONS) });

interface TranslatableContent extends TranslationSource {
  children?: TranslationSource & { key: string };
}

interface AdminResourceDefinition<Input> {
  access: AdminAccess;
  inputSchema: ZodType<Input>;
  translatable?: TranslatableContent;
  list: (query: AdminListQuery) => unknown;
  find: (id: number) => unknown;
  create: (input: Input, actor: Account) => { id: number };
  update: (id: number, input: Input, actor: Account) => void;
  remove: (id: number, actor: Account) => void;
}

export interface AdminResource {
  access: AdminAccess;
  list: (query: AdminListQuery) => unknown;
  find: (id: number, locale?: ContentLocale) => unknown;
  create: (rawInput: unknown, actor: Account) => { id: number };
  update: (id: number, rawInput: unknown, actor: Account, locale?: ContentLocale) => void;
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

type Row = Record<string, unknown>;

const childRowsOf = (record: Row, key: string): Row[] => (Array.isArray(record[key]) ? (record[key] as Row[]) : []);

const storedChildOf = (storedChildren: Row[], child: Row): Row | undefined =>
  typeof child.id === 'number' ? storedChildren.find((stored) => stored.id === child.id) : undefined;

const translatedRecord = (record: Row, content: TranslatableContent, locale: ContentLocale): Row => {
  const [translated] = withTranslations([record], content, locale);
  const { children } = content;
  if (!translated || !children) {
    return translated ?? record;
  }
  return { ...translated, [children.key]: withTranslations(childRowsOf(translated, children.key), children, locale) };
};

const inputWithBaseTexts = (input: Row, base: Row, content: TranslatableContent): Row => {
  const baseInput = { ...input, ...baseValuesOf(base, content) };
  const { children } = content;
  if (!children) {
    return baseInput;
  }
  const storedChildren = childRowsOf(base, children.key);
  return {
    ...baseInput,
    [children.key]: childRowsOf(input, children.key).map((child) => {
      const stored = storedChildOf(storedChildren, child);
      return stored ? { ...child, ...baseValuesOf(stored, children) } : child;
    }),
  };
};

const storeRecordTranslations = (
  id: number,
  input: Row,
  base: Row,
  content: TranslatableContent,
  locale: ContentLocale,
) => {
  storeTranslations(content, id, input, base, locale);
  const { children } = content;
  if (!children) {
    return;
  }
  const storedChildren = childRowsOf(base, children.key);
  for (const child of childRowsOf(input, children.key)) {
    const stored = storedChildOf(storedChildren, child);
    if (stored) {
      storeTranslations(children, stored.id as number, child, stored, locale);
    }
  }
};

const pruneRecordTranslations = (content: TranslatableContent | undefined) => {
  if (!content) {
    return;
  }
  pruneTranslations(content.table);
  if (content.children) {
    pruneTranslations(content.children.table);
  }
};

export const defineAdminResource = <Input>(definition: AdminResourceDefinition<Input>): AdminResource => {
  const content = definition.translatable;
  return {
    access: definition.access,
    list: definition.list,
    find: (id, locale = DEFAULT_LOCALE) => {
      const record = definition.find(id);
      return record && content && locale !== DEFAULT_LOCALE ? translatedRecord(record as Row, content, locale) : record;
    },
    create: (rawInput, actor) => definition.create(parseInput(definition.inputSchema, rawInput), actor),
    update: (id, rawInput, actor, locale = DEFAULT_LOCALE) => {
      const input = parseInput(definition.inputSchema, rawInput);
      if (!content || locale === DEFAULT_LOCALE) {
        definition.update(id, input, actor);
      } else {
        const base = definition.find(id) as Row;
        definition.update(id, inputWithBaseTexts(input as Row, base, content) as Input, actor);
        storeRecordTranslations(id, input as Row, base, content, locale);
      }
      pruneRecordTranslations(content);
    },
    remove: (id, actor) => {
      definition.remove(id, actor);
      pruneRecordTranslations(content);
    },
  };
};

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
  .regex(/^[a-z0-9-]*$/, 'VALIDATION.SLUG_INVALID')
  .default('');

export const conflict = (message: string) => createError({ statusCode: CONFLICT, statusMessage: message });
