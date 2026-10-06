import { describe, expect, it } from 'vitest';
import { zodiacSignOf } from '../../app/utils/zodiac';

const signOn = (date: string) => zodiacSignOf(date).constellation.id;

describe('zodiac sign of a publication date', () => {
  it('changes on the first day of each sign', () => {
    expect(signOn('2016-03-20T12:00:00Z')).toBe('pisces');
    expect(signOn('2016-03-21T12:00:00Z')).toBe('aries');
    expect(signOn('2016-10-22T12:00:00Z')).toBe('libra');
    expect(signOn('2016-10-23T12:00:00Z')).toBe('scorpius');
  });

  it('keeps Capricorn across the New Year', () => {
    expect(signOn('2019-12-22T12:00:00Z')).toBe('capricornus');
    expect(signOn('2020-01-01T12:00:00Z')).toBe('capricornus');
    expect(signOn('2020-01-19T12:00:00Z')).toBe('capricornus');
    expect(signOn('2020-01-20T12:00:00Z')).toBe('aquarius');
  });

  it('reads the day in the time zone of the site', () => {
    expect(signOn('2016-03-20T22:30:00Z')).toBe('pisces');
    expect(signOn('2016-03-20T23:30:00Z')).toBe('aries');
  });

  it('names the sign with a translation key', () => {
    expect(zodiacSignOf('2019-12-27T22:11:54Z').nameKey).toBe('ZODIAC.CAPRICORN');
  });
});
