export type Random = () => number;
export type Point = [x: number, y: number];

export interface Star {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  tint: number;
  twinkleRate: number;
  twinklePhase: number;
}

export const STAR_TINTS = ['#a9c6ff', '#d6e4ff', '#ffffff', '#fff1dc', '#ffd9a0', '#ffb37a'];

export const GLOW_MIN_RADIUS = 1;
export const SPIKE_MIN_RADIUS = 1.9;

const STARS_PER_PIXEL = 1 / 700;
const MAX_STARS = 6000;

const MIN_RADIUS = 0.45;
const MAX_RADIUS = 2.6;
// Every tenfold drop in how common a star is makes it this many times larger (10^0.24 ≈ 1.74),
// which mirrors how few bright stars there are in a real sky.
const MAGNITUDE_SPREAD = 0.24;
const FAINTEST_ALPHA = 0.4;

const TWINKLE_MIN_RADIUS = 0.75;
const TWINKLE_SHARE = 0.35;
const TWINKLE_SLOWEST_SEC = 7;
const TWINKLE_FASTEST_SEC = 2.5;

const BAND_START: Point = [-0.1, 0.95];
const BAND_END: Point = [1.1, 0.1];
const BAND_STAR_SHARE = 0.4;
const BAND_STAR_SPREAD = 0.16;

const FULL_TURN = Math.PI * 2;
const UINT32_RANGE = 4294967296;

const bandLength = Math.hypot(BAND_END[0] - BAND_START[0], BAND_END[1] - BAND_START[1]);
const bandNormal: Point = [(BAND_START[1] - BAND_END[1]) / bandLength, (BAND_END[0] - BAND_START[0]) / bandLength];

// mulberry32
export const createSeededRandom = (seed: number): Random => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), state | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / UINT32_RANGE;
  };
};

export const between = (random: Random, min: number, max: number): number => min + random() * (max - min);

export const pointNearBand = (random: Random, spread: number): Point => {
  const along = random();
  const across = (random() + random() + random() - 1.5) * spread;
  return [
    BAND_START[0] + (BAND_END[0] - BAND_START[0]) * along + bandNormal[0] * across,
    BAND_START[1] + (BAND_END[1] - BAND_START[1]) * along + bandNormal[1] * across,
  ];
};

export const starCountFor = (width: number, height: number): number =>
  Math.min(MAX_STARS, Math.round(width * height * STARS_PER_PIXEL));

export const generateStars = (count: number, random: Random): Star[] =>
  Array.from({ length: count }, () => {
    const [x, y] = random() < BAND_STAR_SHARE ? pointNearBand(random, BAND_STAR_SPREAD) : [random(), random()];
    const radius = Math.min(MAX_RADIUS, MIN_RADIUS * random() ** -MAGNITUDE_SPREAD);
    const prominence = Math.min(1, (radius - MIN_RADIUS) / (GLOW_MIN_RADIUS - MIN_RADIUS));
    const twinkles = radius > TWINKLE_MIN_RADIUS && radius < SPIKE_MIN_RADIUS && random() < TWINKLE_SHARE;
    return {
      x,
      y,
      radius,
      alpha: between(random, 0.7, 1) * (FAINTEST_ALPHA + (1 - FAINTEST_ALPHA) * prominence),
      tint: Math.floor(random() * STAR_TINTS.length),
      twinkleRate: twinkles ? FULL_TURN / between(random, TWINKLE_FASTEST_SEC, TWINKLE_SLOWEST_SEC) : 0,
      twinklePhase: random() * FULL_TURN,
    };
  });
