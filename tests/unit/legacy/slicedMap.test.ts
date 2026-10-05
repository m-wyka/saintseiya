import { describe, expect, it } from 'vitest';
import { parseSlicedMap } from '../../../scripts/legacy/slicedMap';

const image = (src: string, width?: number, height?: number, attributes = '') =>
  `<img src="${src}"${width === undefined ? '' : ` width="${width}"`}${height === undefined ? '' : ` height="${height}"`} ${attributes}/>`;
const spacer = (width: number, height: number) => image('images/spacer.gif', width, height);
const cell = (content: string, attributes = '') => `<td ${attributes}>${content}</td>`;
const row = (...cells: string[]) => `<tr>${cells.join('')}</tr>`;
const table = (...rows: string[]) => `<table border="0" cellpadding="0" cellspacing="0">${rows.join('')}</table>`;
const link = (href: string, content: string) => `<a href="${href}">${content}</a>`;

describe('parseSlicedMap', () => {
  it('places slices by the widths and heights of the cells', () => {
    const map = parseSlicedMap(
      table(
        row(cell(image('a.png', 100, 40)), cell(image('b.png', 60, 40))),
        row(cell(image('c.png', 100, 25)), cell(image('d.png', 60, 25))),
      ),
    );
    expect(map).toEqual({
      width: 160,
      height: 65,
      slices: [
        { src: 'a.png', x: 0, y: 0, width: 100, height: 40 },
        { src: 'b.png', x: 100, y: 0, width: 60, height: 40 },
        { src: 'c.png', x: 0, y: 40, width: 100, height: 25 },
        { src: 'd.png', x: 100, y: 40, width: 60, height: 25 },
      ],
      areas: [],
    });
  });

  it('leaves the spacer column and row out of the picture but uses them to measure the grid', () => {
    const map = parseSlicedMap(
      table(
        row(cell(image('top.png', 150, 30), 'colspan="2"'), cell(spacer(1, 30))),
        row(cell(image('left.png', 90, 20)), cell(image('right.png', 60, 20)), cell(spacer(1, 20))),
        row(cell(spacer(90, 1)), cell(spacer(60, 1)), cell('')),
      ),
    );
    expect(map.width).toBe(150);
    expect(map.height).toBe(50);
    expect(map.slices).toEqual([
      { src: 'top.png', x: 0, y: 0, width: 150, height: 30 },
      { src: 'left.png', x: 0, y: 30, width: 90, height: 20 },
      { src: 'right.png', x: 90, y: 30, width: 60, height: 20 },
    ]);
  });

  it('skips the columns taken by a cell spanning rows above', () => {
    const map = parseSlicedMap(
      table(
        row(cell(image('tall.png', 50, 70), 'rowspan="2"'), cell(image('wide.png', 120, 30), 'colspan="2"')),
        row(cell(image('middle.png', 80, 40)), cell(image('corner.png', 40, 40))),
        row(cell(image('bottom.png', 170, 10), 'colspan="3"')),
      ),
    );
    expect(map.slices).toEqual([
      { src: 'tall.png', x: 0, y: 0, width: 50, height: 70 },
      { src: 'wide.png', x: 50, y: 0, width: 120, height: 30 },
      { src: 'middle.png', x: 50, y: 30, width: 80, height: 40 },
      { src: 'corner.png', x: 130, y: 30, width: 40, height: 40 },
      { src: 'bottom.png', x: 0, y: 70, width: 170, height: 10 },
    ]);
  });

  it('solves uneven columns from overlapping spans alone', () => {
    const map = parseSlicedMap(
      table(
        row(cell(image('a.png', 150, 10), 'colspan="3"')),
        row(cell(image('b.png', undefined, 10)), cell(image('c.png', 120, 10), 'colspan="2"')),
        row(cell(image('d.png', 110, 10), 'colspan="2"'), cell(image('e.png', undefined, 10))),
      ),
    );
    expect(map.slices.map(({ src, x, width }) => [src, x, width])).toEqual([
      ['a.png', 0, 150],
      ['b.png', 0, 30],
      ['c.png', 30, 120],
      ['d.png', 0, 110],
      ['e.png', 110, 40],
    ]);
  });

  it('solves uneven rows from overlapping spans alone', () => {
    const map = parseSlicedMap(
      table(
        row(
          cell(image('a.png', 10, 90), 'rowspan="3"'),
          cell(image('b.png', 10), 'rowspan="2"'),
          cell(image('c.png', 10, 25)),
        ),
        row(cell(image('d.png', 10, 65), 'rowspan="2"')),
        row(cell(image('e.png', 10, 20))),
      ),
    );
    expect(map.slices.map(({ src, y, height }) => [src, y, height])).toEqual([
      ['a.png', 0, 90],
      ['b.png', 0, 70],
      ['c.png', 0, 25],
      ['d.png', 25, 65],
      ['e.png', 70, 20],
    ]);
  });

  it('shares the space evenly between columns and rows that have no sizes', () => {
    const map = parseSlicedMap(
      table(
        row(cell(image('header.png', 90, 20), 'colspan="3"'), cell(image('side.png', 10, 60), 'rowspan="3"')),
        row(cell(image('a.png')), cell(image('b.png')), cell(image('c.png'))),
        row(cell(image('d.png')), cell(image('e.png')), cell(image('f.png'))),
      ),
    );
    expect(map.slices.slice(2).map(({ src, x, y, width, height }) => [src, x, y, width, height])).toEqual([
      ['a.png', 0, 20, 30, 20],
      ['b.png', 30, 20, 30, 20],
      ['c.png', 60, 20, 30, 20],
      ['d.png', 0, 40, 30, 20],
      ['e.png', 30, 40, 30, 20],
      ['f.png', 60, 40, 30, 20],
    ]);
  });

  it('reads sizes from the cell when the image has none and accepts pixel units', () => {
    const map = parseSlicedMap(
      table(row(cell(image('a.png'), 'width="70px" height="30"'), cell(image('b.png', 50, 30)))),
    );
    expect(map.slices).toEqual([
      { src: 'a.png', x: 0, y: 0, width: 70, height: 30 },
      { src: 'b.png', x: 70, y: 0, width: 50, height: 30 },
    ]);
  });

  it('turns linked slices into areas labelled with the bold tooltip text', () => {
    const tooltip = '<span> <B>Ryba Południowa</B>\n<i>(Pisces Austrinus)</i></span>';
    const map = parseSlicedMap(
      table(
        row(
          cell(image('sky.png', 40, 50)),
          cell(`<a href=" rybapd.htm " class="tip">${image('fish.png', 95, 50)}${tooltip}</a>`),
          cell(`<a href="pegaz.htm">${tooltip.replace('Ryba Południowa', 'Pegaz')}${image('pegasus.png', 72, 50)}</a>`),
        ),
      ),
    );
    expect(map.areas).toEqual([
      { href: 'rybapd.htm', label: 'Ryba Południowa', x: 40, y: 0, width: 95, height: 50 },
      { href: 'pegaz.htm', label: 'Pegaz', x: 135, y: 0, width: 72, height: 50 },
    ]);
  });

  it('falls back to the link text, the image description and the link title for a label', () => {
    const map = parseSlicedMap(
      table(
        row(
          cell(link('a.htm', `${image('a.png', 10, 10)}<span>Zwykły&nbsp;opis</span>`)),
          cell(link('b.htm', image('b.png', 10, 10, 'alt="Opis obrazka"'))),
          cell(link('c.htm', image('c.png', 10, 10, 'alt="" title="Tytuł obrazka"'))),
          cell(`<a href="d.htm" title="Tytuł odnośnika">${image('d.png', 10, 10)}</a>`),
          cell(link('viewpage.php?page_id=7', image('e.png', 10, 10, 'alt=""'))),
        ),
      ),
    );
    expect(map.areas.map((area) => area.label)).toEqual([
      'Zwykły opis',
      'Opis obrazka',
      'Tytuł obrazka',
      'Tytuł odnośnika',
      '',
    ]);
  });

  it('ignores links around spacers and links without an address', () => {
    const map = parseSlicedMap(
      table(
        row(
          cell(link('a.htm', spacer(20, 10))),
          cell(`<a name="anchor">${image('b.png', 30, 10)}</a>`),
          cell(link('', image('c.png', 30, 10))),
        ),
      ),
    );
    expect(map.slices.map((slice) => slice.src)).toEqual(['b.png', 'c.png']);
    expect(map.areas).toEqual([]);
  });

  it('treats a cell background as a slice and leaves the text links inside it alone', () => {
    const map = parseSlicedMap(
      table(
        row(cell(link('viewpage.php?page_id=30', image('a.png', 200, 40)))),
        row(
          cell(
            '<p><a href="viewpage.php?page_id=347">Królestwo Umarłych</a></p>',
            `background='images/footer.png' width="200" height="60"`,
          ),
        ),
      ),
    );
    expect(map.slices).toEqual([
      { src: 'a.png', x: 0, y: 0, width: 200, height: 40 },
      { src: 'images/footer.png', x: 0, y: 40, width: 200, height: 60 },
    ]);
    expect(map.areas.map((area) => area.href)).toEqual(['viewpage.php?page_id=30']);
  });

  it('crops filler cells around the picture', () => {
    const map = parseSlicedMap(
      table(
        row(cell(spacer(100, 5), 'colspan="2"')),
        row(cell(spacer(20, 30)), cell(link('a.htm', image('a.png', 80, 30)))),
        row(cell(spacer(100, 11), 'colspan="2" bgcolor="#000000"')),
      ),
    );
    expect(map).toEqual({
      width: 80,
      height: 30,
      slices: [{ src: 'a.png', x: 0, y: 0, width: 80, height: 30 }],
      areas: [{ href: 'a.htm', label: '', x: 0, y: 0, width: 80, height: 30 }],
    });
  });

  it('reads rows wrapped in table sections and keeps a tall span inside the table', () => {
    const map = parseSlicedMap(
      `<p>Wstęp</p><TABLE><TBODY>${row(cell(image('a.png', 10, 30), 'rowspan="50"'), cell(image('b.png', 20, 10)))}${row(
        cell(image('c.png', 20, 20)),
      )}</TBODY></TABLE>`,
    );
    expect(map.slices).toEqual([
      { src: 'a.png', x: 0, y: 0, width: 10, height: 30 },
      { src: 'b.png', x: 10, y: 0, width: 20, height: 10 },
      { src: 'c.png', x: 10, y: 10, width: 20, height: 20 },
    ]);
  });

  it('returns an empty map when there is no sliced table', () => {
    expect(parseSlicedMap('<p>Zwykła treść</p>')).toEqual({ width: 0, height: 0, slices: [], areas: [] });
    expect(parseSlicedMap(table(row(cell('tekst'))))).toEqual({ width: 0, height: 0, slices: [], areas: [] });
  });
});
