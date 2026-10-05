import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { messageKey, parseMessageKey } from '../../shared/utils/messages';
import { localizePagePath } from '../../shared/utils/routes';

const KEY_PATTERN = /^[A-Z][A-Z0-9_]*\.[A-Z0-9_]+$/;
const USED_KEY_PATTERN = /['"`]([A-Z][A-Z0-9_]*\.[A-Z][A-Z0-9_]*)['"`]/g;
const SOURCE_DIRS = ['app', 'server', 'shared'];
const SOURCE_EXTENSIONS = ['.vue', '.ts'];

const messagesOf = (locale: string): Record<string, string> =>
  JSON.parse(readFileSync(join('i18n', 'locales', `${locale}.json`), 'utf8')) as Record<string, string>;

const sourceFiles = (): string[] =>
  SOURCE_DIRS.flatMap((directory) =>
    readdirSync(directory, { recursive: true, encoding: 'utf8' })
      .filter((file) => SOURCE_EXTENSIONS.some((extension) => file.endsWith(extension)))
      .map((file) => join(directory, file)),
  );

const placeholdersOf = (message: string): string[] => [...new Set(message.match(/\{\w+\}/g) ?? [])].sort();

describe('translation files', () => {
  const polish = messagesOf('pl');
  const english = messagesOf('en');

  it('keeps flat SECTION.KEY names with the same keys in both languages', () => {
    expect(Object.keys(polish).filter((key) => !KEY_PATTERN.test(key))).toEqual([]);
    expect(Object.keys(english).sort()).toEqual(Object.keys(polish).sort());
  });

  it('uses the same placeholders in both languages', () => {
    const mismatched = Object.keys(polish).filter(
      (key) => placeholdersOf(polish[key]!).join() !== placeholdersOf(english[key] ?? '').join(),
    );
    expect(mismatched).toEqual([]);
  });

  it('defines every key referenced in the code', () => {
    const missing = new Set<string>();
    for (const file of sourceFiles()) {
      for (const [, key] of readFileSync(file, 'utf8').matchAll(USED_KEY_PATTERN)) {
        if (key && !(key in polish)) {
          missing.add(`${key} (${file})`);
        }
      }
    }
    expect([...missing]).toEqual([]);
  });
});

describe('message keys sent by the server', () => {
  it('round-trips a key with and without parameters', () => {
    expect(parseMessageKey(messageKey('ERRORS.NOT_FOUND'))).toEqual({ key: 'ERRORS.NOT_FOUND', params: {} });
    expect(parseMessageKey(messageKey('VALIDATION.POLL_TOO_FEW_OPTIONS', { min: 2 }))).toEqual({
      key: 'VALIDATION.POLL_TOO_FEW_OPTIONS',
      params: { min: 2 },
    });
  });

  it('leaves ordinary text alone', () => {
    expect(parseMessageKey('Too small: expected string to have >=2 characters')).toBeNull();
  });
});

describe('page addresses', () => {
  it('gives English page files their Polish address', () => {
    expect(localizePagePath('news/category/[slug]')).toBe('newsy/kategoria/[slug]');
    expect(localizePagePath('admin/users')).toBe('admin/uzytkownicy');
    expect(localizePagePath('forum/section/[slug]/new-thread')).toBe('forum/dzial/[slug]/nowy-temat');
  });
});
