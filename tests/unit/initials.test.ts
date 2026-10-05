import { describe, expect, it } from 'vitest';
import { initialsOf } from '../../app/utils/initials';

describe('initials shown as an avatar', () => {
  it('takes the first letter of a one-word nick', () => {
    expect(initialsOf('hekate')).toBe('H');
  });

  it('takes the first letters of the first two words', () => {
    expect(initialsOf('Smok Shiryu z Rozan')).toBe('SS');
    expect(initialsOf('złoty_rycerz')).toBe('ZR');
  });

  it('reads an e-mail address by its name part', () => {
    expect(initialsOf('jan.kowalski@example.com')).toBe('JK');
  });

  it('gives nothing when the nick has no letters or digits', () => {
    expect(initialsOf(' ._- ')).toBe('');
  });
});
