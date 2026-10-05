import { describe, expect, it } from 'vitest';
import { CONSTELLATIONS, fitConstellation, segmentsOf } from '../../app/utils/constellations';
import type { Box, Constellation } from '../../app/utils/constellations';
import { GLOW_MIN_RADIUS, createSeededRandom, generateStars, starCountFor } from '../../app/utils/starfield';

const ZODIAC = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpius',
  'sagittarius',
  'capricornus',
  'aquarius',
  'pisces',
];
const BRONZE_SAINTS = ['pegasus', 'draco', 'cygnus', 'andromeda', 'phoenix'];
const ROUNDING = 0.001;

const constellation = (id: string): Constellation => CONSTELLATIONS.find((candidate) => candidate.id === id)!;

const extentOf = (points: [number, number][]) => {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
};

describe('constellations', () => {
  it('cover the zodiac and the five Bronze Saints', () => {
    expect(CONSTELLATIONS.map(({ id }) => id)).toEqual([...ZODIAC, ...BRONZE_SAINTS]);
  });

  it('keep every figure in a unit box with its longer side filling it', () => {
    for (const { id, stars } of CONSTELLATIONS) {
      const { left, right, top, bottom } = extentOf(stars);
      expect([left, top], id).toEqual([0, 0]);
      expect(Math.max(right, bottom), id).toBe(1);
    }
  });

  it('draw lines only between stars of the figure and leave no star unconnected', () => {
    for (const figure of CONSTELLATIONS) {
      const connected = new Set(segmentsOf(figure).flat());
      expect(
        [...connected].sort((first, second) => first - second),
        figure.id,
      ).toEqual(figure.stars.map((_, star) => star));
      expect(figure.stars[figure.brightest], figure.id).toBeDefined();
    }
  });

  it('turn consecutive stars of a path into segments', () => {
    expect(
      segmentsOf({
        id: 'test',
        stars: [],
        paths: [
          [0, 1, 2],
          [1, 3],
        ],
        brightest: 0,
      }),
    ).toEqual([
      [0, 1],
      [1, 2],
      [1, 3],
    ]);
  });

  it('fit every figure inside the box, touching two opposite edges, at any turn', () => {
    const box: Box = { x: 40, y: 100, width: 260, height: 180 };
    for (const figure of CONSTELLATIONS) {
      for (const turn of [0, 1, 2.5, 4]) {
        const { left, right, top, bottom } = extentOf(fitConstellation(figure, box, turn));
        expect(left, figure.id).toBeGreaterThanOrEqual(box.x - ROUNDING);
        expect(right, figure.id).toBeLessThanOrEqual(box.x + box.width + ROUNDING);
        expect(top, figure.id).toBeGreaterThanOrEqual(box.y - ROUNDING);
        expect(bottom, figure.id).toBeLessThanOrEqual(box.y + box.height + ROUNDING);
        const slack = Math.min(box.width - (right - left), box.height - (bottom - top));
        expect(slack, figure.id).toBeLessThan(ROUNDING);
      }
    }
  });

  it('stand a long figure upright in a narrow margin instead of shrinking it', () => {
    const margin: Box = { x: 0, y: 0, width: 80, height: 340 };
    const { top, bottom } = extentOf(fitConstellation(constellation('leo'), margin, 0));
    expect(bottom - top).toBeGreaterThan(margin.width * 1.5);
  });

  it('keep the shape of a figure when fitting it', () => {
    const figure = constellation('pegasus');
    const distance = (points: [number, number][], from: number, to: number) =>
      Math.hypot(points[to]![0] - points[from]![0], points[to]![1] - points[from]![1]);
    const fitted = fitConstellation(figure, { x: 0, y: 0, width: 300, height: 200 }, 1.3);
    const scale = distance(fitted, 0, 1) / distance(figure.stars, 0, 1);
    for (const [from, to] of segmentsOf(figure)) {
      expect(distance(fitted, from, to)).toBeCloseTo(distance(figure.stars, from, to) * scale, 6);
    }
  });
});

describe('starfield', () => {
  it('generates the same sky for the same seed and a different one for another', () => {
    expect(generateStars(200, createSeededRandom(7))).toEqual(generateStars(200, createSeededRandom(7)));
    expect(generateStars(200, createSeededRandom(7))).not.toEqual(generateStars(200, createSeededRandom(8)));
  });

  it('keeps the stars in place when the sky grows', () => {
    const small = generateStars(150, createSeededRandom(7));
    expect(generateStars(600, createSeededRandom(7)).slice(0, small.length)).toEqual(small);
  });

  it('has many faint stars and only a few bright ones', () => {
    const stars = generateStars(4000, createSeededRandom(7));
    const bright = stars.filter((star) => star.radius > GLOW_MIN_RADIUS).length;
    expect(bright).toBeGreaterThan(40);
    expect(bright).toBeLessThan(stars.length * 0.08);
    expect(stars.every((star) => star.radius > 0 && star.alpha > 0 && star.alpha <= 1)).toBe(true);
  });

  it('lets only some of the mid-sized stars twinkle', () => {
    const stars = generateStars(4000, createSeededRandom(7));
    const twinklers = stars.filter((star) => star.twinkleRate > 0);
    expect(twinklers.length).toBeGreaterThan(40);
    expect(twinklers.length).toBeLessThan(stars.length * 0.1);
  });

  it('scales the number of stars with the area up to a limit', () => {
    expect(starCountFor(1400, 700)).toBe(1400);
    expect(starCountFor(2800, 1400)).toBe(5600);
    expect(starCountFor(10_000, 10_000)).toBe(6000);
  });
});
