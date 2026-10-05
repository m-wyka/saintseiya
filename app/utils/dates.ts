const SITE_TIME_ZONE = 'Europe/Warsaw';
const SITE_LOCALE = 'pl-PL';

const longDateFormat = new Intl.DateTimeFormat(SITE_LOCALE, { dateStyle: 'long', timeZone: SITE_TIME_ZONE });
const dateTimeFormat = new Intl.DateTimeFormat(SITE_LOCALE, {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: SITE_TIME_ZONE,
});
const numberFormat = new Intl.NumberFormat(SITE_LOCALE);

type DateInput = string | number | Date;

export const formatLongDate = (value: DateInput): string => longDateFormat.format(new Date(value));

export const formatDateTime = (value: DateInput): string => dateTimeFormat.format(new Date(value));

export const formatNumber = (value: number): string => numberFormat.format(value);

const PLURAL_RULES = new Intl.PluralRules(SITE_LOCALE);

export const pluralize = (count: number, one: string, few: string, many: string): string => {
  const form = PLURAL_RULES.select(count);
  const word = form === 'one' ? one : form === 'few' ? few : many;
  return `${formatNumber(count)} ${word}`;
};

const FILE_SIZE_UNITS = ['B', 'KB', 'MB', 'GB'];
const FILE_SIZE_STEP = 1024;

export const formatFileSize = (bytes: number): string => {
  const unitIndex = Math.min(
    FILE_SIZE_UNITS.length - 1,
    Math.floor(Math.log(Math.max(bytes, 1)) / Math.log(FILE_SIZE_STEP)),
  );
  const value = bytes / FILE_SIZE_STEP ** unitIndex;
  return `${numberFormat.format(Number(value.toFixed(unitIndex === 0 ? 0 : 1)))} ${FILE_SIZE_UNITS[unitIndex]}`;
};
