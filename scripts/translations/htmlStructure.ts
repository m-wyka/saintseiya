import { Parser } from 'htmlparser2';

// A translation may reword `alt` and `title`; every other attribute has to come back untouched.
const TRANSLATABLE_ATTRIBUTES = new Set(['alt', 'title']);

export type StructureVerdict = 'same' | 'reordered' | 'different';

export interface StructureComparison {
  verdict: StructureVerdict;
  missing: string[];
  unexpected: string[];
}

const openingTagOf = (name: string, attributes: Record<string, string>): string => {
  const kept = Object.entries(attributes)
    .filter(([attribute]) => !TRANSLATABLE_ATTRIBUTES.has(attribute))
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([attribute, value]) => ` ${attribute}="${value}"`);
  return `<${name}${kept.join('')}>`;
};

export const tagSequenceOf = (html: string): string[] => {
  const tags: string[] = [];
  const parser = new Parser({
    onopentag: (name, attributes) => tags.push(openingTagOf(name, attributes)),
    onclosetag: (name) => tags.push(`</${name}>`),
  });
  parser.end(html);
  return tags;
};

const isOpeningTag = (tag: string): boolean => !tag.startsWith('</');

const countOf = (tags: string[]): Map<string, number> => {
  const counts = new Map<string, number>();
  tags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1));
  return counts;
};

const surplusOf = (tags: string[], others: string[]): string[] => {
  const otherCounts = countOf(others);
  return [...countOf(tags)].flatMap(([tag, count]) => {
    const extra = count - (otherCounts.get(tag) ?? 0);
    return extra > 0 ? [extra > 1 ? `${tag} ×${extra}` : tag] : [];
  });
};

// Inline tags may change places when a sentence is reworded; a tag that is gone, new or altered may not.
export const compareStructure = (sourceHtml: string, translatedHtml: string): StructureComparison => {
  const sourceTags = tagSequenceOf(sourceHtml);
  const translatedTags = tagSequenceOf(translatedHtml);
  const missing = surplusOf(sourceTags.filter(isOpeningTag), translatedTags.filter(isOpeningTag));
  const unexpected = surplusOf(translatedTags.filter(isOpeningTag), sourceTags.filter(isOpeningTag));
  if (missing.length || unexpected.length) {
    return { verdict: 'different', missing, unexpected };
  }
  const isSameOrder = sourceTags.every((tag, index) => tag === translatedTags[index]);
  return { verdict: isSameOrder ? 'same' : 'reordered', missing, unexpected };
};

const NON_BREAKING_SPACE = ' ';
const TAG_PATTERN = /(<[^>]+>)/;
const BLANK_PATTERN = /^(?:\s|&nbsp;)*$/;

const isSpacer = (text: string): boolean =>
  BLANK_PATTERN.test(text) && (text.includes(NON_BREAKING_SPACE) || text.includes('&nbsp;'));

// The old content spaces its paragraphs with non-breaking spaces, which come back from a translator as ordinary
// ones and would collapse. Works on two texts with the same tags in the same order; otherwise changes nothing.
export const withSourceSpacers = (sourceHtml: string, translatedHtml: string): string => {
  const sourceParts = sourceHtml.split(TAG_PATTERN);
  const translatedParts = translatedHtml.split(TAG_PATTERN);
  if (sourceParts.length !== translatedParts.length) {
    return translatedHtml;
  }
  return translatedParts
    .map((part, index) => (BLANK_PATTERN.test(part) && isSpacer(sourceParts[index]!) ? sourceParts[index] : part))
    .join('');
};

const wrapLine = (line: string, maxLength: number): string => {
  let wrapped = '';
  let lengthOfLastLine = 0;
  let isInsideTag = false;
  for (const character of line) {
    if (character === '<') {
      isInsideTag = true;
    } else if (character === '>') {
      isInsideTag = false;
    }
    const isBreakable = character === ' ' && !isInsideTag && lengthOfLastLine >= maxLength;
    wrapped += isBreakable ? '\n' : character;
    lengthOfLastLine = isBreakable ? 0 : lengthOfLastLine + 1;
  }
  return wrapped;
};

// File readers cut very long lines short. A line break between words means the same to a browser as the space
// it replaces, except in preformatted text, which is left alone.
export const wrapLongLines = (html: string, maxLength: number): string =>
  /<pre\b/i.test(html)
    ? html
    : html
        .split('\n')
        .map((line) => wrapLine(line, maxLength))
        .join('\n');
