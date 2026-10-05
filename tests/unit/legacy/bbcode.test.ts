import { describe, expect, it } from 'vitest';
import { bbcodeToHtml } from '../../../scripts/legacy/bbcode';

describe('bbcodeToHtml', () => {
  it('converts basic formatting and line breaks', () => {
    expect(bbcodeToHtml('[b]Seiya[/b] i [i]Shiryu[/i]\r\n[u]Hyoga[/u]')).toBe(
      '<strong>Seiya</strong> i <em>Shiryu</em><br><u>Hyoga</u>',
    );
  });

  it('converts both link forms', () => {
    expect(bbcodeToHtml('[url]http://example.com/a?b=1&amp;c=2[/url]')).toBe(
      '<a href="http://example.com/a?b=1&amp;c=2">http://example.com/a?b=1&amp;c=2</a>',
    );
    expect(bbcodeToHtml('[url=www.example.com]strona[/url]')).toBe('<a href="http://www.example.com">strona</a>');
  });

  it('keeps relative legacy links for later rewriting', () => {
    expect(bbcodeToHtml('[url=viewthread.php?thread_id=5]temat[/url]')).toBe(
      '<a href="viewthread.php?thread_id=5">temat</a>',
    );
  });

  it('refuses script links but keeps their label', () => {
    expect(bbcodeToHtml('[url=javascript:alert(1)]klik[/url]')).toBe('klik');
  });

  it('converts images and leaves broken image tags as text', () => {
    expect(bbcodeToHtml('[img]http://example.com/a.jpg[/img]')).toBe('<img src="http://example.com/a.jpg" alt="">');
    expect(bbcodeToHtml('[img]http://example.com/a.jpg')).toBe('[img]http://example.com/a.jpg');
  });

  it('converts a quote with the nested author link produced by the old forum', () => {
    const html = bbcodeToHtml(
      '[quote][url=http://saintseiya.netserwer.pl/forum/viewthread.php?thread_id=126&amp;pid=1582#post_1582][b]verien napisał(a):[/b][/url]\n\nTreść[/quote]',
    );
    expect(html).toBe(
      '<blockquote><a href="http://saintseiya.netserwer.pl/forum/viewthread.php?thread_id=126&amp;pid=1582#post_1582"><strong>verien napisał(a):</strong></a><br><br>Treść</blockquote>',
    );
  });

  it('does not interpret markup inside code blocks', () => {
    expect(bbcodeToHtml('[code][b]x[/b] :) <tag>[/code]')).toBe('<pre><code>[b]x[/b] :) &lt;tag&gt;</code></pre>');
  });

  it('converts the less common tags', () => {
    expect(bbcodeToHtml('[center][small]mały[/small][/center]')).toBe(
      '<div style="text-align:center"><small>mały</small></div>',
    );
    expect(bbcodeToHtml('[color=#ff0000]czerwony[/color][size=20]duży[/size]')).toBe(
      '<span style="color:#ff0000">czerwony</span>duży',
    );
    expect(bbcodeToHtml('[color=expression(x)]tekst[/color]')).toBe('tekst');
    expect(bbcodeToHtml('[spoiler]Hades[/spoiler]')).toBe('<details><summary>Spoiler</summary>Hades</details>');
    expect(bbcodeToHtml('[mail]ktos@example.com[/mail]')).toBe(
      '<a href="mailto:ktos@example.com">ktos@example.com</a>',
    );
  });

  it('keeps unknown, unclosed and unmatched tags as plain text', () => {
    expect(bbcodeToHtml('R.I.P [*] [manga]x[/manga]')).toBe('R.I.P [*] [manga]x[/manga]');
    expect(bbcodeToHtml('[b]bez końca')).toBe('[b]bez końca');
    expect(bbcodeToHtml('koniec[/b] bez początku')).toBe('koniec[/b] bez początku');
    expect(bbcodeToHtml('[b]a [i]b[/b] c')).toBe('<strong>a [i]b</strong> c');
  });

  it('never lets raw angle brackets through', () => {
    expect(bbcodeToHtml('<script>alert(1)</script> &lt;b&gt;')).toBe('&lt;script&gt;alert(1)&lt;/script&gt; &lt;b&gt;');
  });

  it('leaves smileys as text when the post had them switched off', () => {
    expect(bbcodeToHtml('[b]ok[/b] :)', { smileys: false })).toBe('<strong>ok</strong> :)');
  });

  it('turns text smileys into emoji only where they stand alone', () => {
    expect(bbcodeToHtml('Super :) i tak ;) :D')).toBe('Super 🙂 i tak 😉 😀');
    expect(bbcodeToHtml('fajnie :P.')).toBe('fajnie 😛.');
    expect(bbcodeToHtml('http://example.com/:Dysk i godz. 12:00')).toBe('http://example.com/:Dysk i godz. 12:00');
    expect(bbcodeToHtml('(wariant A lub B) oraz B)')).toBe('(wariant A lub B) oraz 😎');
  });
});
