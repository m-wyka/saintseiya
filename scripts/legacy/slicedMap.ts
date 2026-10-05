import { DomUtils, parseDocument } from 'htmlparser2';
import { collapseWhitespace } from './text';

type Element = NonNullable<ReturnType<typeof DomUtils.findOne>>;

const SPACER_IMAGE_PATTERN = /(?:^|\/)spacer\.gif$/i;
const PIXEL_LENGTH_PATTERN = /^\s*(\d+(?:\.\d+)?)\s*(?:px)?\s*$/i;
const ROW_GROUP_TAGS = new Set(['thead', 'tbody', 'tfoot']);
const CELL_TAGS = new Set(['td', 'th']);
const BOLD_TAGS = new Set(['b', 'strong']);

export interface SlicedMapRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SlicedMapSlice extends SlicedMapRect {
  src: string;
}

export interface SlicedMapArea extends SlicedMapRect {
  href: string;
  label: string;
}

export interface SlicedMap {
  width: number;
  height: number;
  slices: SlicedMapSlice[];
  areas: SlicedMapArea[];
}

interface CellLink {
  href: string;
  label: string;
}

interface CellContent {
  src: string | null;
  declaredWidth: number | null;
  declaredHeight: number | null;
  link: CellLink | null;
}

interface GridCell extends CellContent {
  column: number;
  row: number;
  columnSpan: number;
  rowSpan: number;
}

interface Picture extends SlicedMapRect {
  src: string;
  link: CellLink | null;
}

interface KnownDistance {
  start: number;
  end: number;
  length: number;
}

const emptyMap = (): SlicedMap => ({ width: 0, height: 0, slices: [], areas: [] });

const childElements = (parent: Element): Element[] => DomUtils.getElementsByTagName(() => true, parent.children, false);

const tableRows = (table: Element): Element[][] =>
  childElements(table)
    .flatMap((child) => (ROW_GROUP_TAGS.has(child.name) ? childElements(child) : [child]))
    .filter((child) => child.name === 'tr')
    .map((row) => childElements(row).filter((cell) => CELL_TAGS.has(cell.name)));

const spanOf = (cell: Element, attribute: 'colspan' | 'rowspan'): number => {
  const span = Number.parseInt(cell.attribs[attribute] ?? '', 10);
  return span > 0 ? span : 1;
};

const pixelLength = (value: string | undefined): number | null => {
  const pixels = PIXEL_LENGTH_PATTERN.exec(value ?? '')?.[1];
  return pixels === undefined ? null : Number(pixels);
};

const isSpacerImage = (image: Element): boolean => SPACER_IMAGE_PATTERN.test(image.attribs.src?.trim() ?? '');

const contains = (ancestor: Element, descendant: Element): boolean =>
  DomUtils.existsOne((element) => element === descendant, ancestor.children);

const firstText = (candidates: (string | undefined)[]): string =>
  candidates.map((text) => collapseWhitespace(text ?? '')).find(Boolean) ?? '';

const linkLabel = (link: Element, image: Element): string => {
  const bold = DomUtils.findOne((element) => BOLD_TAGS.has(element.name), link.children);
  return firstText([
    bold ? DomUtils.textContent(bold) : '',
    DomUtils.textContent(link),
    image.attribs.alt,
    image.attribs.title,
    link.attribs.title,
  ]);
};

const linkAround = (cell: Element, image: Element): CellLink | null => {
  const link = DomUtils.getElementsByTagName('a', cell.children).find((anchor) => contains(anchor, image));
  const href = link?.attribs.href?.trim();
  return link && href ? { href, label: linkLabel(link, image) } : null;
};

const readCell = (cell: Element): CellContent => {
  const images = DomUtils.getElementsByTagName('img', cell.children);
  const slice = images.find((image) => image.attribs.src?.trim() && !isSpacerImage(image));
  const sized = slice ?? images[0];
  return {
    src: slice?.attribs.src?.trim() ?? cell.attribs.background?.trim() ?? null,
    declaredWidth: pixelLength(sized?.attribs.width) ?? pixelLength(cell.attribs.width),
    declaredHeight: pixelLength(sized?.attribs.height) ?? pixelLength(cell.attribs.height),
    link: slice ? linkAround(cell, slice) : null,
  };
};

const gridKey = (row: number, column: number) => `${row}:${column}`;

const placeCells = (rows: Element[][]): GridCell[] => {
  const occupied = new Set<string>();
  return rows.flatMap((cells, row) => {
    let column = 0;
    return cells.map((element) => {
      while (occupied.has(gridKey(row, column))) {
        column += 1;
      }
      const placed = {
        ...readCell(element),
        column,
        row,
        columnSpan: spanOf(element, 'colspan'),
        rowSpan: Math.min(spanOf(element, 'rowspan'), rows.length - row),
      };
      for (let spannedRow = row; spannedRow < row + placed.rowSpan; spannedRow += 1) {
        for (let spannedColumn = column; spannedColumn < column + placed.columnSpan; spannedColumn += 1) {
          occupied.add(gridKey(spannedRow, spannedColumn));
        }
      }
      column += placed.columnSpan;
      return placed;
    });
  });
};

const applyDistance = (offsets: Map<number, number>, { start, end, length }: KnownDistance): boolean => {
  const startOffset = offsets.get(start);
  const endOffset = offsets.get(end);
  if (startOffset !== undefined && endOffset === undefined) {
    offsets.set(end, startOffset + length);
  }
  if (startOffset === undefined && endOffset !== undefined) {
    offsets.set(start, endOffset - length);
  }
  return startOffset !== undefined || endOffset !== undefined;
};

const propagateDistances = (distances: KnownDistance[], offsets = new Map([[0, 0]])): Map<number, number> => {
  const unresolved = distances.filter((distance) => !applyDistance(offsets, distance));
  return unresolved.length < distances.length ? propagateDistances(unresolved, offsets) : offsets;
};

const spreadUnsolvedOffsets = (solved: Map<number, number>, boundaryCount: number): number[] => {
  const solvedBoundaries = [...solved.keys()].sort((first, second) => first - second);
  return Array.from({ length: boundaryCount }, (_, boundary) => {
    const before = solvedBoundaries.findLast((candidate) => candidate <= boundary) ?? 0;
    const after = solvedBoundaries.find((candidate) => candidate >= boundary) ?? before;
    const share = after === before ? 0 : (boundary - before) / (after - before);
    const beforeOffset = solved.get(before) ?? 0;
    return Math.round(beforeOffset + ((solved.get(after) ?? beforeOffset) - beforeOffset) * share);
  });
};

const solveOffsets = (distances: KnownDistance[], lastBoundary: number): number[] =>
  spreadUnsolvedOffsets(propagateDistances(distances), lastBoundary + 1);

const knownDistance = (start: number, span: number, length: number | null): KnownDistance[] =>
  length === null ? [] : [{ start, end: start + span, length }];

const measurePictures = (cells: GridCell[]): Picture[] => {
  const columnOffsets = solveOffsets(
    cells.flatMap((cell) => knownDistance(cell.column, cell.columnSpan, cell.declaredWidth)),
    Math.max(0, ...cells.map((cell) => cell.column + cell.columnSpan)),
  );
  const rowOffsets = solveOffsets(
    cells.flatMap((cell) => knownDistance(cell.row, cell.rowSpan, cell.declaredHeight)),
    Math.max(0, ...cells.map((cell) => cell.row + cell.rowSpan)),
  );
  return cells.flatMap(({ src, link, column, row, columnSpan, rowSpan }) => {
    const x = columnOffsets[column]!;
    const y = rowOffsets[row]!;
    const width = columnOffsets[column + columnSpan]! - x;
    const height = rowOffsets[row + rowSpan]! - y;
    return src && width > 0 && height > 0 ? [{ src, link, x, y, width, height }] : [];
  });
};

const boundsOf = (rects: SlicedMapRect[]): SlicedMapRect => {
  const x = Math.min(...rects.map((rect) => rect.x));
  const y = Math.min(...rects.map((rect) => rect.y));
  return {
    x,
    y,
    width: Math.max(...rects.map((rect) => rect.x + rect.width)) - x,
    height: Math.max(...rects.map((rect) => rect.y + rect.height)) - y,
  };
};

export const parseSlicedMap = (html: string): SlicedMap => {
  const table = DomUtils.findOne((element) => element.name === 'table', parseDocument(html).children);
  const pictures = table ? measurePictures(placeCells(tableRows(table))) : [];
  if (!pictures.length) {
    return emptyMap();
  }
  const bounds = boundsOf(pictures);
  const positioned = pictures.map((picture) => ({ ...picture, x: picture.x - bounds.x, y: picture.y - bounds.y }));
  return {
    width: bounds.width,
    height: bounds.height,
    slices: positioned.map(({ src, x, y, width, height }) => ({ src, x, y, width, height })),
    areas: positioned.flatMap(({ link, x, y, width, height }) => (link ? [{ ...link, x, y, width, height }] : [])),
  };
};
