import type { MapAreaTarget } from '#shared/utils/content';

export interface EditableMapArea {
  label: string;
  leftPercent: number;
  topPercent: number;
  widthPercent: number;
  heightPercent: number;
  targetKind: MapAreaTarget;
  pageId: number | null;
  pageTitle: string | null;
  url: string | null;
  contentHtml: string | null;
}

export const MAP_AREA_TARGET_LABELS: Record<MapAreaTarget, string> = {
  page: 'Podstrona portalu',
  url: 'Dowolny adres',
  content: 'Okienko z treścią',
};

const PERCENT_MAX = 100;
const COORDINATE_PRECISION = 100;

const roundPercent = (value: number): number => Math.round(value * COORDINATE_PRECISION) / COORDINATE_PRECISION;

export const clampPercent = (value: number, upperBound = PERCENT_MAX): number =>
  roundPercent(Math.min(Math.max(value, 0), upperBound));

export const newMapArea = (
  frame: Pick<EditableMapArea, 'leftPercent' | 'topPercent' | 'widthPercent' | 'heightPercent'>,
): EditableMapArea => ({
  ...frame,
  label: 'Nowy obszar',
  targetKind: 'page',
  pageId: null,
  pageTitle: null,
  url: null,
  contentHtml: null,
});
