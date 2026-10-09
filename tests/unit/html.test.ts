import { describe, expect, it } from 'vitest';
import { escapeHtml, htmlToPlainText, sanitizeRichHtml, youtubeIdFromUrl } from '../../server/utils/html';
import { markLayoutHints } from '../../server/utils/layoutHints';

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

  it('drops near-black text colour that the dark theme would hide', () => {
    expect(sanitizeRichHtml('<span style="color: #000000;">A</span><span style="color: #333;">B</span>')).toBe('AB');
    expect(sanitizeRichHtml('<span style="color: #8b4513;">C</span>')).toBe('<span style="color:#8b4513">C</span>');
  });

  it('removes links left with nothing to show', () => {
    const html = '<p><a href="/uzytkownik/1"></a><a href="/forum"> &nbsp;</a><a href="/uzytkownik/1">Jamnik</a></p>';
    expect(sanitizeRichHtml(html)).toBe('<p><a href="/uzytkownik/1">Jamnik</a></p>');
    expect(sanitizeRichHtml('<a href="/galeria"><img src="/media/a.jpg" /></a>')).toContain('<img');
    expect(sanitizeRichHtml('<p><a href="/x"><span style="color:#ffcc99"><strong> </strong></span></a>tekst</p>')).toBe(
      '<p>tekst</p>',
    );
  });

  it('keeps a linked picture that sits deeper inside its link', () => {
    const html = '<a href="/mapy/mapa-nieba"><span style="color:#ffcc99"><img src="/media/logo.png" /></span></a>';

    expect(sanitizeRichHtml(html)).toBe(
      '<a href="/mapy/mapa-nieba"><span style="color:#ffcc99"><img src="/media/logo.png" alt="" loading="lazy" /></span></a>',
    );
  });

  it('stores colours written by the editor as rgb() in the hex form the theme rules match', () => {
    expect(sanitizeRichHtml('<span style="color: rgb(255, 204, 153);">A</span>')).toBe(
      '<span style="color:#ffcc99">A</span>',
    );
    expect(sanitizeRichHtml('<p style="text-align: center; color: rgb(255 155 13 / 1)">B</p>')).toBe(
      '<p style="text-align:center;color:#ff9b0d">B</p>',
    );
    expect(sanitizeRichHtml('<span style="color: rgb(0, 0, 0);">C</span>')).toBe('C');
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

describe('markLayoutHints', () => {
  it('marks a paragraph that is one short bold phrase as a subheading', () => {
    expect(markLayoutHints('<p><strong>Manga jako kanon?</strong></p>')).toBe(
      '<p class="subheading"><strong>Manga jako kanon?</strong></p>',
    );
    expect(markLayoutHints('<p style="text-align:center"><span style="color:#ffcc99"><b>Dane:</b></span></p>')).toBe(
      '<p class="subheading" style="text-align:center"><span style="color:#ffcc99"><b>Dane:</b></span></p>',
    );
  });

  it('leaves labels, empty and long bold paragraphs as plain text', () => {
    const label = '<p><strong>Na podstawie: </strong>mangi o tym samym tytule</p>';
    const twoPhrases = '<p><strong>Jedno</strong> i <strong>drugie</strong></p>';
    const empty = '<p style="text-align:center"><strong><br /></strong></p>';
    const sentence = `<p><strong>${'Bardzo długie zdanie wyróżnione pogrubieniem. '.repeat(3)}</strong></p>`;

    for (const html of [label, twoPhrases, empty, sentence]) {
      expect(markLayoutHints(html)).toBe(html);
    }
  });

  it('tells a picture cut into cells from rows of picture tiles', () => {
    const sliced =
      '<table><tbody><tr><td rowspan="2"><img src="/a.png" /></td><td><a href="/x"> <img src="/b.png" /></a></td></tr><tr><td><br /></td></tr></tbody></table>';
    const tiles =
      '<table><tbody><tr><td><a href="/x"><img src="/a.jpg" /></a> <a href="/y"><img src="/b.jpg" /></a></td></tr></tbody></table>';

    expect(markLayoutHints(sliced)).toContain('<table class="sliced-image">');
    expect(markLayoutHints(tiles)).toContain('<table class="image-grid">');
  });

  it('leaves tables with any text and single pictures alone', () => {
    const profile = '<table><tbody><tr><td><img src="/a.png" /></td><td>Seiya</td></tr></tbody></table>';
    const single = '<table><tbody><tr><td><img src="/a.png" /></td></tr></tbody></table>';

    expect(markLayoutHints(profile)).toBe(profile);
    expect(markLayoutHints(single)).toBe(single);
  });

  it('centres a paragraph made only of linked pictures', () => {
    const tiles = '<p><a href="/x"><img src="/a.jpg" /></a> <a href="/y"> <img src="/b.jpg" /></a></p>';

    expect(markLayoutHints(tiles)).toBe(`<p class="image-grid">${tiles.slice(3)}`);
    expect(markLayoutHints('<p><a href="/x"><img src="/a.jpg" /></a></p>')).not.toContain('image-grid');
    expect(markLayoutHints('<p><a href="/x"><img src="/a.jpg" /></a> <a href="/y">dalej</a></p>')).not.toContain(
      'image-grid',
    );
  });
});
