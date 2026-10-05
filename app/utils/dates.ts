const SITE_TIME_ZONE = 'Europe/Warsaw';
const DEFAULT_LANGUAGE = 'pl-PL';

interface LanguageFormats {
  longDate: Intl.DateTimeFormat;
  dateTime: Intl.DateTimeFormat;
  number: Intl.NumberFormat;
}

const formatsByLanguage = new Map<string, LanguageFormats>();

const currentFormats = (): LanguageFormats => {
  const language = tryUseNuxtApp()?.$i18n.localeProperties.value.language ?? DEFAULT_LANGUAGE;
  let formats = formatsByLanguage.get(language);
  if (!formats) {
    formats = {
      longDate: new Intl.DateTimeFormat(language, { dateStyle: 'long', timeZone: SITE_TIME_ZONE }),
      dateTime: new Intl.DateTimeFormat(language, {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: SITE_TIME_ZONE,
      }),
      number: new Intl.NumberFormat(language),
    };
    formatsByLanguage.set(language, formats);
  }
  return formats;
};

type DateInput = string | number | Date;

export const formatLongDate = (value: DateInput): string => currentFormats().longDate.format(new Date(value));

export const formatDateTime = (value: DateInput): string => currentFormats().dateTime.format(new Date(value));

export const formatNumber = (value: number): string => currentFormats().number.format(value);

const FILE_SIZE_UNITS = ['B', 'KB', 'MB', 'GB'];
const FILE_SIZE_STEP = 1024;

export const formatFileSize = (bytes: number): string => {
  const unitIndex = Math.min(
    FILE_SIZE_UNITS.length - 1,
    Math.floor(Math.log(Math.max(bytes, 1)) / Math.log(FILE_SIZE_STEP)),
  );
  const value = bytes / FILE_SIZE_STEP ** unitIndex;
  return `${formatNumber(Number(value.toFixed(unitIndex === 0 ? 0 : 1)))} ${FILE_SIZE_UNITS[unitIndex]}`;
};
