import { describe, expect, it } from 'vitest';
import { compareStructure, withSourceSpacers, wrapLongLines } from '../../../scripts/translations/htmlStructure';

describe('compareStructure', () => {
  it('accepts a translation that changes only the text', () => {
    const source = '<p style="text-align:center">Ala <strong>ma</strong> kota<br /><a href="/forum">Forum</a></p>';
    const translated =
      '<p style="text-align:center">Alice <strong>has</strong> a cat<br /><a href="/forum">Board</a></p>';
    expect(compareStructure(source, translated)).toEqual({ verdict: 'same', missing: [], unexpected: [] });
  });

  it('lets alt and title be reworded', () => {
    const source = '<p><img src="/media/a.png" alt="Rycerz" title="Złoty Rycerz" width="10" /></p>';
    const translated = '<p><img src="/media/a.png" alt="Saint" title="Gold Saint" width="10" /></p>';
    expect(compareStructure(source, translated).verdict).toBe('same');
  });

  it('tells apart inline tags that only changed places', () => {
    const source = '<p><strong>Atena</strong> i <em>Posejdon</em></p>';
    const translated = '<p><em>Poseidon</em> and <strong>Athena</strong></p>';
    expect(compareStructure(source, translated).verdict).toBe('reordered');
  });

  it('names the tags that are gone, new or altered', () => {
    const source = '<p>Pierwszy<br /><br /><a href="/newsy/powrot">więcej</a></p><p> </p>';
    const translated = '<p>First<br /><a href="/news/return">more</a> <em>!</em></p>';
    expect(compareStructure(source, translated)).toEqual({
      verdict: 'different',
      missing: ['<p>', '<br>', '<a href="/newsy/powrot">'],
      unexpected: ['<a href="/news/return">', '<em>'],
    });
  });
});

describe('withSourceSpacers', () => {
  it('gives blank paragraphs their non-breaking spaces back', () => {
    const source = '<p>Pierwszy</p>\n<p> </p>\n<p><strong>&nbsp;</strong>Drugi akapit</p>';
    const translated = '<p>First</p>\n<p> </p>\n<p><strong></strong>Second paragraph</p>';
    expect(withSourceSpacers(source, translated)).toBe(
      '<p>First</p>\n<p> </p>\n<p><strong>&nbsp;</strong>Second paragraph</p>',
    );
  });

  it('changes nothing when the tags do not line up', () => {
    expect(withSourceSpacers('<p> </p><p>Tekst</p>', '<p>Text</p>')).toBe('<p>Text</p>');
  });
});

describe('wrapLongLines', () => {
  it('breaks a long line between words and never inside a tag', () => {
    const html = '<p>raz dwa <a href="/a b" title="trzy cztery">pięć sześć</a> siedem</p>';
    expect(wrapLongLines(html, 8)).toBe('<p>raz dwa\n<a href="/a b" title="trzy cztery">pięć\nsześć</a>\nsiedem</p>');
  });

  it('leaves short lines and preformatted text alone', () => {
    expect(wrapLongLines('<p>raz dwa</p>\n<p>trzy</p>', 40)).toBe('<p>raz dwa</p>\n<p>trzy</p>');
    expect(wrapLongLines('<pre>raz dwa trzy cztery</pre>', 4)).toBe('<pre>raz dwa trzy cztery</pre>');
  });
});
