const WORD_SEPARATORS = /[\s._@-]+/;
const MAX_INITIALS = 2;

export const initialsOf = (name: string): string =>
  name
    .split(WORD_SEPARATORS)
    .filter(Boolean)
    .slice(0, MAX_INITIALS)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
