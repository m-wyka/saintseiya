import { CONSTELLATIONS } from './constellations';
import type { Constellation } from './constellations';
import { siteMonthAndDay } from './dates';

export interface ZodiacSign {
  nameKey: string;
  constellation: Constellation;
}

// In calendar order; Capricorn comes last because it runs across the New Year.
const SIGN_FIRST_DAYS = [
  { month: 1, day: 20, constellationId: 'aquarius', nameKey: 'ZODIAC.AQUARIUS' },
  { month: 2, day: 19, constellationId: 'pisces', nameKey: 'ZODIAC.PISCES' },
  { month: 3, day: 21, constellationId: 'aries', nameKey: 'ZODIAC.ARIES' },
  { month: 4, day: 20, constellationId: 'taurus', nameKey: 'ZODIAC.TAURUS' },
  { month: 5, day: 21, constellationId: 'gemini', nameKey: 'ZODIAC.GEMINI' },
  { month: 6, day: 21, constellationId: 'cancer', nameKey: 'ZODIAC.CANCER' },
  { month: 7, day: 23, constellationId: 'leo', nameKey: 'ZODIAC.LEO' },
  { month: 8, day: 23, constellationId: 'virgo', nameKey: 'ZODIAC.VIRGO' },
  { month: 9, day: 23, constellationId: 'libra', nameKey: 'ZODIAC.LIBRA' },
  { month: 10, day: 23, constellationId: 'scorpius', nameKey: 'ZODIAC.SCORPIO' },
  { month: 11, day: 22, constellationId: 'sagittarius', nameKey: 'ZODIAC.SAGITTARIUS' },
  { month: 12, day: 22, constellationId: 'capricornus', nameKey: 'ZODIAC.CAPRICORN' },
];

export const zodiacSignOf = (date: string | number | Date): ZodiacSign => {
  const { month, day } = siteMonthAndDay(date);
  const { constellationId, nameKey } =
    SIGN_FIRST_DAYS.findLast((sign) => month > sign.month || (month === sign.month && day >= sign.day)) ??
    SIGN_FIRST_DAYS.at(-1)!;
  return { nameKey, constellation: CONSTELLATIONS.find((candidate) => candidate.id === constellationId)! };
};
