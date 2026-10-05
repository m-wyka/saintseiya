const EMPTY_CELL = '—';

export const cellText = (row: object, key: string): string => {
  const value = (row as Record<string, unknown>)[key];
  return value === null || value === undefined || value === '' ? EMPTY_CELL : String(value);
};
