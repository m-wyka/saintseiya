import { describe, expect, it } from 'vitest';
import { convertLegacyBbcode, convertLegacyHtml, lineBreaksToHtml } from '../../../scripts/legacy/html';

const keepEverything = {};

describe('convertLegacyHtml', () => {
  it('unescapes stored markup and cleans it', () => {
    expect(
      convertLegacyHtml('<p class=\\"western\\" style=\\"text-align: justify;\\">Kt&oacute;ry</p>', keepEverything),
    ).toBe('<p>Który</p>');
  });

  it('replaces old Flash embeds of YouTube films with frames and drops other Flash', () => {
    const flash =
      '<object width=\\"425\\"><param name=\\"movie\\" value=\\"http://www.youtube.com/v/dEY9fXqqaFE?hl=pl\\"></param><embed src=\\"http://www.youtube.com/v/dEY9fXqqaFE\\"></embed></object>';
    expect(convertLegacyHtml(flash, keepEverything)).toBe(
      '<iframe src="https://www.youtube-nocookie.com/embed/dEY9fXqqaFE" title="Film YouTube" loading="lazy" allowfullscreen></iframe>',
    );
    expect(convertLegacyHtml('<p>A</p><embed src=\\"menu.swf\\">', keepEverything)).toBe('<p>A</p>');
  });

  it('trims blank paragraphs at the edges and collapses runs of them', () => {
    const html = '<p>&nbsp;</p>\n<p>A</p>\n<p>&nbsp;</p>\n<p><br /></p>\n<p> </p>\n<p>B</p>\n<p>&nbsp;</p>';
    expect(convertLegacyHtml(html, keepEverything)).toBe('<p>A</p>\n<p>&nbsp;</p><p>B</p>');
  });
});

describe('convertLegacyBbcode', () => {
  it('converts markup and passes links and images through the rewriter', () => {
    const html = convertLegacyBbcode(
      '[url=viewthread.php?thread_id=5][b]temat[/b][/url] [img]http://example.com/a.jpg[/img]',
      {
        link: () => '/forum/temat/5',
        image: (src) => src,
      },
    );
    expect(html).toBe(
      '<a href="/forum/temat/5"><strong>temat</strong></a> <img src="http://example.com/a.jpg" alt="" loading="lazy" />',
    );
  });
});

describe('lineBreaksToHtml', () => {
  it('adds a break at every line ending', () => {
    expect(lineBreaksToHtml('a\r\nb\nc')).toBe('a<br>\nb<br>\nc');
  });
});
