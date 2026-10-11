// A bundle is a plain-text file handed to the translator and returned in the same shape: optional notes, then
// one section per field, opened by `@@@ <key>` and closed by the next marker. Lines starting with `## ` right
// under a key are context for the translator, not content. The last line is `@@@ END`, so a file that was cut
// short is recognisable.

const ITEM_MARKER = '@@@ ';
const CONTEXT_MARKER = '## ';
const END_KEY = 'END';

export interface BundleItem {
  key: string;
  text: string;
  context?: string;
}

export interface ParsedBundle {
  items: BundleItem[];
  isComplete: boolean;
}

const sectionOf = (item: BundleItem): string =>
  [
    `${ITEM_MARKER}${item.key}`,
    ...(item.context ? [`${CONTEXT_MARKER}${item.context.replace(/\s+/g, ' ')}`] : []),
    item.text,
  ].join('\n');

export const formatBundle = (notes: string[], items: BundleItem[]): string =>
  [...(notes.length ? [notes.join('\n')] : []), ...items.map(sectionOf), `${ITEM_MARKER}${END_KEY}`].join('\n\n') +
  '\n';

export const parseBundle = (content: string): ParsedBundle => {
  const [, ...sections] = content.replace(/\r\n?/g, '\n').split(/^@@@ /m);
  const items = sections.map((section) => {
    const [key = '', ...lines] = section.split('\n');
    const contentStart = lines.findIndex((line) => !line.startsWith(CONTEXT_MARKER));
    return { key: key.trim(), text: (contentStart === -1 ? [] : lines.slice(contentStart)).join('\n').trim() };
  });
  return {
    items: items.filter((item) => item.key !== END_KEY),
    isComplete: items.at(-1)?.key === END_KEY,
  };
};
