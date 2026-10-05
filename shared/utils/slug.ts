const POLISH_LETTERS: Record<string, string> = {
  ą: 'a',
  ć: 'c',
  ę: 'e',
  ł: 'l',
  ń: 'n',
  ó: 'o',
  ś: 's',
  ź: 'z',
  ż: 'z',
};

const MAX_SLUG_LENGTH = 80;

export const slugify = (text: string): string =>
  text
    .toLocaleLowerCase('pl')
    .replace(/[ąćęłńóśźż]/g, (letter) => POLISH_LETTERS[letter] ?? letter)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/, '');

export const uniqueSlug = (text: string, isTaken: (candidate: string) => boolean, fallback = 'bez-tytulu'): string => {
  const base = slugify(text) || fallback;
  if (!isTaken(base)) {
    return base;
  }
  let suffix = 2;
  while (isTaken(`${base}-${suffix}`)) {
    suffix += 1;
  }
  return `${base}-${suffix}`;
};
