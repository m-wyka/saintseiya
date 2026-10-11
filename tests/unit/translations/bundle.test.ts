import { describe, expect, it } from 'vitest';
import { formatBundle, parseBundle } from '../../../scripts/translations/bundle';

describe('translation bundle', () => {
  it('writes notes, sections with their context and the end marker', () => {
    const content = formatBundle(
      ['Established translations:', '- Złoci Rycerze = Gold Saints'],
      [
        { key: 'pages:1:title', context: 'path: saint-seiya/manga', text: 'Manga' },
        { key: 'pages:1:body_html', text: '<p>Pierwsza</p>\n<p>Druga</p>' },
      ],
    );
    expect(content).toBe(
      [
        'Established translations:',
        '- Złoci Rycerze = Gold Saints',
        '',
        '@@@ pages:1:title',
        '## path: saint-seiya/manga',
        'Manga',
        '',
        '@@@ pages:1:body_html',
        '<p>Pierwsza</p>',
        '<p>Druga</p>',
        '',
        '@@@ END',
        '',
      ].join('\n'),
    );
  });

  it('reads back the sections without notes and context', () => {
    const content = formatBundle(
      ['A note'],
      [
        { key: 'polls:3:question', context: 'in "Ankieta"', text: 'Pytanie?' },
        { key: 'news:7:body_html', text: '<p>Treść</p>\n\n<p>Dalej</p>' },
      ],
    );
    expect(parseBundle(content)).toEqual({
      items: [
        { key: 'polls:3:question', text: 'Pytanie?' },
        { key: 'news:7:body_html', text: '<p>Treść</p>\n\n<p>Dalej</p>' },
      ],
      isComplete: true,
    });
  });

  it('reads Windows line endings and notices a file cut short', () => {
    const parsed = parseBundle('@@@ pages:1:title\r\nManga\r\n\r\n@@@ pages:2:title\r\nAni');
    expect(parsed).toEqual({
      items: [
        { key: 'pages:1:title', text: 'Manga' },
        { key: 'pages:2:title', text: 'Ani' },
      ],
      isComplete: false,
    });
  });
});
