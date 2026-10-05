import { describe, expect, it } from 'vitest';
import { calmTitle, decodeTextEntities, legacyPlainText, stripLegacySlashes } from '../../../scripts/legacy/text';

describe('stripLegacySlashes', () => {
  it('removes one level of escaping', () => {
    expect(stripLegacySlashes('<p style=\\"text-align: center;\\">It\\\'s</p>')).toBe(
      '<p style="text-align: center;">It\'s</p>',
    );
  });

  it('keeps a literal backslash that was escaped', () => {
    expect(stripLegacySlashes('C:\\\\Saint')).toBe('C:\\Saint');
  });

  it('leaves text without slashes untouched', () => {
    expect(stripLegacySlashes('Pegasus Ryūsei Ken')).toBe('Pegasus Ryūsei Ken');
  });
});

describe('decodeTextEntities', () => {
  it('decodes named and numeric entities', () => {
    expect(decodeTextEntities('Manga &amp; Anime &quot;SS&quot; &#937;mega &#x3A9; &#039;x&#039;')).toBe(
      'Manga & Anime "SS" Ωmega Ω \'x\'',
    );
  });

  it('keeps unknown or invalid entities as written', () => {
    expect(decodeTextEntities('&oacute; &#0; &#99999999;')).toBe('&oacute; &#0; &#99999999;');
  });
});

describe('legacyPlainText', () => {
  it('decodes entities and collapses whitespace', () => {
    expect(legacyPlainText('  Saint   Seiya &amp;\n Lost Canvas ')).toBe('Saint Seiya & Lost Canvas');
  });
});

describe('legacyPlainText truncation', () => {
  it('drops an entity cut off by the column length limit', () => {
    expect(legacyPlainText('Tribute to Cancer&#3')).toBe('Tribute to Cancer');
    expect(legacyPlainText('Manga &amp; Anime &am')).toBe('Manga & Anime');
  });
});

describe('calmTitle', () => {
  it('turns an all-caps title into capitalized words', () => {
    expect(calmTitle('KRÓLESTWO  PIEKIEŁ')).toBe('Królestwo Piekieł');
  });

  it('keeps mixed-case titles as written', () => {
    expect(calmTitle('Widma Ziemskie')).toBe('Widma Ziemskie');
    expect(calmTitle('Saint Seiya Ω')).toBe('Saint Seiya Ω');
  });
});
