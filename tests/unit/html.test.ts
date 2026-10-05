import { describe, expect, it } from 'vitest';
import { escapeHtml, htmlToPlainText, sanitizeRichHtml, youtubeIdFromUrl } from '../../server/utils/html';

describe('sanitizeRichHtml', () => {
  it('removes scripts, event handlers and unknown tags', () => {
    expect(sanitizeRichHtml('<p onclick="x()">Tekst<script>alert(1)</script><marquee>!</marquee></p>')).toBe(
      '<p>Tekst!</p>',
    );
  });

  it('drops editor classes, justification and presentational styles but keeps alignment and colour', () => {
    const html =
      '<p class="MsoNormal" style="text-align: justify; font-size: 10px; mso-list: l0;"><span style="color: #ffcc99; font-family: Arial;">A</span></p>';
    expect(sanitizeRichHtml(html)).toBe('<p><span style="color:#ffcc99">A</span></p>');
    expect(sanitizeRichHtml('<p style="text-align: center;">B</p>')).toBe('<p style="text-align:center">B</p>');
  });

  it('drops white text colour so the theme decides', () => {
    expect(sanitizeRichHtml('<span style="color: #ffffff;">A</span><span style="color: #fff;">B</span>')).toBe('AB');
  });

  it('marks external links and leaves internal ones plain', () => {
    expect(sanitizeRichHtml('<a href="https://example.com" onclick="x()">zewn.</a>')).toBe(
      '<a href="https://example.com" target="_blank" rel="noopener nofollow">zewn.</a>',
    );
    expect(sanitizeRichHtml('<a href="/forum" target="_blank">forum</a>')).toBe('<a href="/forum">forum</a>');
  });

  it('removes dangerous link targets', () => {
    expect(sanitizeRichHtml('<a href="javascript:alert(1)">x</a>')).toBe(
      '<a target="_blank" rel="noopener nofollow">x</a>',
    );
  });

  it('applies the link and image rewriters', () => {
    const html = sanitizeRichHtml(
      '<a href="viewpage.php?page_id=3"><img src="/img/a.jpg" width="100" height="60" style="float: left; margin: 6px;" /></a>',
      {
        link: () => '/saint-seiya/anime',
        image: (src) => `/media/legacy${src}`,
      },
    );
    expect(html).toBe(
      '<a href="/saint-seiya/anime"><img src="/media/legacy/img/a.jpg" alt="" width="100" height="60" style="float:left" loading="lazy" /></a>',
    );
  });

  it('unwraps links and removes images the rewriter rejects', () => {
    expect(sanitizeRichHtml('<a href="x">tekst</a><img src="y" />', { link: () => null, image: () => null })).toBe(
      'tekst',
    );
  });

  it('unwraps spans that carry no styling, however they are nested', () => {
    expect(sanitizeRichHtml('<span><span style="color:#ff0000"><span class="x">A</span> B</span> C</span>')).toBe(
      '<span style="color:#ff0000">A B</span> C',
    );
  });

  it('converts legacy presentational tags', () => {
    expect(sanitizeRichHtml('<center><font color="#ff0000"><b>A</b> <i>B</i></font></center><h1>T</h1>')).toBe(
      '<div style="text-align:center"><span style="color:#ff0000"><strong>A</strong> <em>B</em></span></div><h2>T</h2>',
    );
  });

  it('keeps only YouTube frames, on the privacy-friendly host', () => {
    expect(sanitizeRichHtml('<iframe src="http://www.youtube.com/embed/dEY9fXqqaFE?rel=0" width="560"></iframe>')).toBe(
      '<iframe src="https://www.youtube-nocookie.com/embed/dEY9fXqqaFE" title="Film YouTube" loading="lazy" allowfullscreen></iframe>',
    );
    expect(sanitizeRichHtml('<iframe src="https://evil.example/x"></iframe>')).toBe('');
  });

  it('keeps table structure without layout attributes', () => {
    expect(
      sanitizeRichHtml(
        '<table width="750" border="0"><tbody><tr><td colspan="2" width="100" style="height: 25px; text-align: center;">A</td></tr></tbody></table>',
      ),
    ).toBe('<table><tbody><tr><td colspan="2" style="text-align:center">A</td></tr></tbody></table>');
  });
});

describe('helpers', () => {
  it('escapes HTML special characters', () => {
    expect(escapeHtml(`<a href="x">Tom & 'Jerry'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;Tom &amp; &#39;Jerry&#39;&lt;/a&gt;',
    );
  });

  it('extracts YouTube identifiers from the address forms used in old content', () => {
    expect(youtubeIdFromUrl('http://www.youtube.com/v/m0ELO7Fwsqs?version=3&hl=pl_PL')).toBe('m0ELO7Fwsqs');
    expect(youtubeIdFromUrl('https://www.youtube.com/watch?feature=x&v=m0ELO7Fwsqs')).toBe('m0ELO7Fwsqs');
    expect(youtubeIdFromUrl('https://youtu.be/m0ELO7Fwsqs')).toBe('m0ELO7Fwsqs');
    expect(youtubeIdFromUrl('https://example.com/video')).toBeNull();
  });

  it('reduces HTML to readable text', () => {
    expect(htmlToPlainText('<p>Saint <strong>Seiya</strong></p>\n<p>Omega</p>')).toBe('Saint Seiya Omega');
    expect(htmlToPlainText('<p>Manga &amp; Anime &lt;3 &quot;SS&quot;</p>')).toBe('Manga & Anime <3 "SS"');
  });

  it('keeps words apart where a line break or a block boundary separated them', () => {
    expect(htmlToPlainText('Cały świat?<br /><br />Isko25<p>Saga</p><ul><li>Milo</li><li>Aiolia</li></ul>')).toBe(
      'Cały świat? Isko25 Saga Milo Aiolia',
    );
    expect(htmlToPlainText('<table><tr><td>Saori</td><td>Sho</td></tr></table>')).toBe('Saori Sho');
  });
});
