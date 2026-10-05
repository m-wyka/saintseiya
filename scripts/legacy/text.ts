const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  quot: '"',
  apos: "'",
  lt: '<',
  gt: '>',
  nbsp: ' ',
};

const MAX_CODE_POINT = 0x10ffff;

export const stripLegacySlashes = (text: string): string => text.replace(/\\(.?)/gs, '$1');

const decodeNumericEntity = (body: string, entity: string): string => {
  const isHexadecimal = body[1]?.toLowerCase() === 'x';
  const codePoint = isHexadecimal ? Number.parseInt(body.slice(2), 16) : Number(body.slice(1));
  return Number.isInteger(codePoint) && codePoint > 0 && codePoint <= MAX_CODE_POINT
    ? String.fromCodePoint(codePoint)
    : entity;
};

export const decodeTextEntities = (text: string): string =>
  text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, body: string) =>
    body.startsWith('#') ? decodeNumericEntity(body, entity) : (NAMED_ENTITIES[body.toLowerCase()] ?? entity),
  );

export const collapseWhitespace = (text: string): string => text.replace(/\s+/g, ' ').trim();

const TRUNCATED_ENTITY_PATTERN = /&#?[a-z0-9]{0,7}$/i;

export const legacyPlainText = (text: string): string =>
  collapseWhitespace(decodeTextEntities(text.replace(TRUNCATED_ENTITY_PATTERN, '')));

const isShouting = (text: string): boolean =>
  text === text.toLocaleUpperCase('pl') && text !== text.toLocaleLowerCase('pl');

const capitalizeWord = (word: string): string =>
  word.charAt(0).toLocaleUpperCase('pl') + word.slice(1).toLocaleLowerCase('pl');

export const calmTitle = (text: string): string => {
  const title = collapseWhitespace(text);
  return isShouting(title) ? title.split(' ').map(capitalizeWord).join(' ') : title;
};

export const unixSecondsToDate = (seconds: number): Date => new Date(seconds * 1000);
