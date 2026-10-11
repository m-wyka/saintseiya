import { createHash } from 'node:crypto';
import { formatBundle } from './bundle';
import type { BundleItem } from './bundle';
import { plainTextOf } from './contentFields';
import type { ContentField } from './contentFields';
import { wrapLongLines } from './htmlStructure';

const MAX_LINE_LENGTH = 900;
const MAX_GLOSSARY_ENTRIES = 80;
const MIN_GLOSSARY_TERM_LENGTH = 4;
const MAX_GLOSSARY_TERM_LENGTH = 60;
const GLOSSARY_HEADING =
  'Titles of the site’s pages and sections, already translated — use exactly these where this file names or links to one:';
// A poll answer or a constellation label is translated for its one place ("Smok" is Draco on the star map and
// Dragon everywhere else), so only the titles readers navigate by serve as reference.
const GLOSSARY_ENTITIES = new Set(['pages', 'navigation_links', 'navigation_sections', 'news_categories']);

export interface Bundle {
  name: string;
  content: string;
  keys: string[];
}

const sizeOf = (field: ContentField): number => field.key.length + field.hint.length + field.source.length;

const inChunks = (fields: ContentField[], maxChars: number, keepsSectionsApart: boolean): ContentField[][] => {
  const chunks: ContentField[][] = [];
  let size = 0;
  for (const field of fields) {
    const previous = chunks.at(-1)?.at(-1);
    const startsSection = keepsSectionsApart && previous?.section !== field.section;
    if (!previous || startsSection || size + sizeOf(field) > maxChars) {
      chunks.push([]);
      size = 0;
    }
    chunks.at(-1)!.push(field);
    size += sizeOf(field);
  }
  return chunks;
};

const nameOf = (kind: string, index: number, keys: string[]): string => {
  const fingerprint = createHash('sha1').update(keys.join('\n')).digest('hex').slice(0, 8);
  return `${kind}-${String(index + 1).padStart(3, '0')}-${fingerprint}.txt`;
};

// One translation per distinct text: the same label in twenty places should read the same in English.
const distinctTexts = (fields: ContentField[]): ContentField[] => {
  const firstByText = new Map<string, ContentField>();
  for (const field of fields) {
    if (!firstByText.has(field.source.trim())) {
      firstByText.set(field.source.trim(), field);
    }
  }
  return [...firstByText.values()];
};

const textItemOf = (field: ContentField): BundleItem => ({
  key: field.key,
  context: field.hint,
  text: field.source.trim(),
});

const htmlItemOf = (field: ContentField, stored: Map<string, string>): BundleItem => {
  const englishName = stored.get(field.nameKey);
  const name = englishName ? `"${field.recordName}" = "${englishName}"` : `"${field.recordName}"`;
  return {
    key: field.key,
    context: [name, field.hint].filter(Boolean).join(', '),
    text: wrapLongLines(field.source.replace(/\r\n?/g, '\n').trim(), MAX_LINE_LENGTH),
  };
};

const escapedForPattern = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const appearsIn = (text: string, term: string): boolean =>
  new RegExp(`(?<![\\p{L}\\p{N}])${escapedForPattern(term)}(?![\\p{L}\\p{N}])`, 'iu').test(text);

const glossaryOf = (fields: ContentField[], stored: Map<string, string>): [string, string][] => {
  const terms = new Map<string, string>();
  for (const field of fields) {
    const term = field.source.trim();
    const translation = stored.get(field.key);
    const isUsable =
      field.kind === 'text' &&
      GLOSSARY_ENTITIES.has(field.entity) &&
      translation !== undefined &&
      translation !== term &&
      term.length >= MIN_GLOSSARY_TERM_LENGTH &&
      term.length <= MAX_GLOSSARY_TERM_LENGTH;
    if (isUsable) {
      terms.set(term, translation);
    }
  }
  return [...terms].sort(([first], [second]) => second.length - first.length);
};

const glossaryNotes = (glossary: [string, string][], items: BundleItem[]): string[] => {
  const text = items.map((item) => plainTextOf(item.text, 'html')).join('\n');
  const entries = glossary.filter(([term]) => appearsIn(text, term)).slice(0, MAX_GLOSSARY_ENTRIES);
  return entries.length
    ? [GLOSSARY_HEADING, ...entries.map(([term, translation]) => `- ${term} = ${translation}`)]
    : [];
};

export const planBundles = (fields: ContentField[], stored: Map<string, string>, maxChars: number): Bundle[] => {
  const pending = fields.filter((field) => !stored.has(field.key));
  const glossary = glossaryOf(fields, stored);
  const textChunks = inChunks(distinctTexts(pending.filter((field) => field.kind === 'text')), maxChars, false).map(
    (chunk) => chunk.map(textItemOf),
  );
  const htmlChunks = inChunks(
    pending.filter((field) => field.kind === 'html'),
    maxChars,
    true,
  ).map((chunk) => chunk.map((field) => htmlItemOf(field, stored)));
  const bundleOf =
    (kind: string, notesOf: (items: BundleItem[]) => string[]) => (items: BundleItem[], index: number) => {
      const keys = items.map((item) => item.key);
      return { name: nameOf(kind, index, keys), content: formatBundle(notesOf(items), items), keys };
    };
  return [
    ...textChunks.map(bundleOf('text', () => [])),
    ...htmlChunks.map(bundleOf('html', (items) => glossaryNotes(glossary, items))),
  ];
};
