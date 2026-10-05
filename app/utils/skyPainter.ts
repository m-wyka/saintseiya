import { GLOW_MIN_RADIUS, SPIKE_MIN_RADIUS, STAR_TINTS, between, pointNearBand } from './starfield';
import type { Point, Random, Star } from './starfield';

export interface Size {
  width: number;
  height: number;
}

export interface Figure {
  points: Point[];
  segments: [from: number, to: number][];
  brightest: number;
  starRadius: number;
}

export interface Meteor {
  x: number;
  y: number;
  heading: number;
  distance: number;
  tail: number;
}

const FULL_TURN = Math.PI * 2;

const GLOW_SPRITE_SIZE = 64;
const STAR_GLOW_REACH = 6;
const STAR_GLOW_ALPHA = 0.55;
const SPIKE_REACH = 9;
const SPIKE_WIDTH = 0.7;
const SPIKE_ARMS: Point[] = [
  [1, 0],
  [0, 1.35],
];

const TWINKLE_REACH = 5;
const TWINKLE_ALPHA = 0.9;

const NEBULA_TINTS = ['#0a4a5e', '#0a4a5e', '#0c6f78', '#0f2f5c', '#8a4a10'];
// Few, strong clouds: each gradient is dithered with the same pattern, which shows once dozens overlap.
const NEBULA_CLOUD_COUNT = 26;
const NEBULA_SPREAD = 0.17;
const DUST_LANE_COUNT = 9;
const DUST_LANE_SPREAD = 0.06;

const FIGURE_LINE_TINT = '#b9dfec';
// A crisp core over two ever fainter, wider passes that fade out like a glow instead of ending in an edge.
const FIGURE_LINE_STROKES = [
  { width: 5, alpha: 0.05 },
  { width: 2.5, alpha: 0.1 },
  { width: 1, alpha: 0.65 },
];
const FIGURE_LINE_CLEARANCE = 0.6;
const LEAD_STAR_SCALE = 1.6;
const STARS_IGNITE_OVER_MS = 2400;
const STAR_IGNITE_MS = 800;
const LINES_START_MS = 1200;
const LINES_DRAW_OVER_MS = 3600;
const LINE_DRAW_MS = 900;
const FIGURE_HOLD_MS = 7000;
const FIGURE_FADE_MS = 2600;

export const GOLD_TINT = '#ffdf89';
const FIGURE_DRAWN_MS = LINES_START_MS + LINES_DRAW_OVER_MS + LINE_DRAW_MS;
export const FIGURE_COMPLETE_MS = FIGURE_DRAWN_MS + FIGURE_HOLD_MS;
export const FIGURE_LIFETIME_MS = FIGURE_COMPLETE_MS + FIGURE_FADE_MS;

export const isFigureMoving = (elapsed: number): boolean => elapsed < FIGURE_DRAWN_MS || elapsed > FIGURE_COMPLETE_MS;

const METEOR_TINT = '#ffcc99';
const METEOR_WIDTH = 1.4;
const METEOR_HEAD_RADIUS = 7;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
const easeOut = (progress: number): number => 1 - (1 - progress) ** 3;

const translucent = (hex: string, alpha: number): string =>
  `${hex}${Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0')}`;

export const createGlowSprite = (tint: string): HTMLCanvasElement => {
  const sprite = document.createElement('canvas');
  sprite.width = GLOW_SPRITE_SIZE;
  sprite.height = GLOW_SPRITE_SIZE;
  const ctx = sprite.getContext('2d')!;
  const center = GLOW_SPRITE_SIZE / 2;
  const glow = ctx.createRadialGradient(center, center, 0, center, center, center);
  glow.addColorStop(0, '#ffffff');
  glow.addColorStop(0.08, tint);
  glow.addColorStop(0.22, translucent(tint, 0.3));
  glow.addColorStop(0.5, translucent(tint, 0.08));
  glow.addColorStop(1, translucent(tint, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, GLOW_SPRITE_SIZE, GLOW_SPRITE_SIZE);
  return sprite;
};

const paintGlow = (
  ctx: CanvasRenderingContext2D,
  sprite: HTMLCanvasElement,
  x: number,
  y: number,
  radius: number,
  alpha: number,
) => {
  ctx.globalAlpha = alpha;
  ctx.drawImage(sprite, x - radius, y - radius, radius * 2, radius * 2);
};

const paintBlob = (ctx: CanvasRenderingContext2D, [x, y]: Point, radius: number, color: string, alpha: number) => {
  const blob = ctx.createRadialGradient(x, y, 0, x, y, radius);
  blob.addColorStop(0, translucent(color, alpha));
  blob.addColorStop(1, translucent(color, 0));
  ctx.fillStyle = blob;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
};

// Expects an empty canvas: the dust lanes are cut out of whatever has been painted so far.
export const paintNebula = (ctx: CanvasRenderingContext2D, { width, height }: Size, random: Random) => {
  const reach = Math.max(width, height);
  const scattered = (spread: number): Point => {
    const [x, y] = pointNearBand(random, spread);
    return [x * width, y * height];
  };

  ctx.globalCompositeOperation = 'lighter';
  for (let cloud = 0; cloud < NEBULA_CLOUD_COUNT; cloud++) {
    const tint = NEBULA_TINTS[Math.floor(random() * NEBULA_TINTS.length)]!;
    paintBlob(ctx, scattered(NEBULA_SPREAD), reach * between(random, 0.08, 0.24), tint, between(random, 0.12, 0.36));
  }
  ctx.globalCompositeOperation = 'destination-out';
  for (let lane = 0; lane < DUST_LANE_COUNT; lane++) {
    paintBlob(ctx, scattered(DUST_LANE_SPREAD), reach * between(random, 0.04, 0.1), '#000000', 0.45);
  }
  ctx.globalCompositeOperation = 'source-over';
};

const paintSpikes = (ctx: CanvasRenderingContext2D, [x, y]: Point, reach: number, tint: string) => {
  ctx.lineWidth = SPIKE_WIDTH;
  for (const [armX, armY] of SPIKE_ARMS) {
    const from: Point = [x - armX * reach, y - armY * reach];
    const to: Point = [x + armX * reach, y + armY * reach];
    const spike = ctx.createLinearGradient(...from, ...to);
    spike.addColorStop(0, translucent(tint, 0));
    spike.addColorStop(0.5, translucent(tint, 0.85));
    spike.addColorStop(1, translucent(tint, 0));
    ctx.strokeStyle = spike;
    ctx.beginPath();
    ctx.moveTo(...from);
    ctx.lineTo(...to);
    ctx.stroke();
  }
};

export const paintStars = (
  ctx: CanvasRenderingContext2D,
  { width, height }: Size,
  stars: Star[],
  glows: HTMLCanvasElement[],
  twinklerAlpha: number,
) => {
  ctx.globalCompositeOperation = 'lighter';
  for (const star of stars) {
    const center: Point = [star.x * width, star.y * height];
    const tint = STAR_TINTS[star.tint]!;
    const alpha = star.twinkleRate ? star.alpha * twinklerAlpha : star.alpha;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = tint;
    ctx.beginPath();
    ctx.arc(...center, star.radius, 0, FULL_TURN);
    ctx.fill();
    if (star.radius > GLOW_MIN_RADIUS) {
      paintGlow(ctx, glows[star.tint]!, ...center, star.radius * STAR_GLOW_REACH, alpha * STAR_GLOW_ALPHA);
    }
    if (star.radius > SPIKE_MIN_RADIUS) {
      paintSpikes(ctx, center, star.radius * SPIKE_REACH, tint);
    }
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
};

export const paintTwinkles = (
  ctx: CanvasRenderingContext2D,
  { width, height }: Size,
  twinklers: Star[],
  glows: HTMLCanvasElement[],
  seconds: number,
) => {
  for (const star of twinklers) {
    const wave = 0.5 + 0.5 * Math.sin(seconds * star.twinkleRate + star.twinklePhase);
    paintGlow(
      ctx,
      glows[star.tint]!,
      star.x * width,
      star.y * height,
      star.radius * TWINKLE_REACH,
      wave * wave * TWINKLE_ALPHA,
    );
  }
  ctx.globalAlpha = 1;
};

const traceFigureLines = (ctx: CanvasRenderingContext2D, { points, segments, starRadius }: Figure, elapsed: number) => {
  ctx.beginPath();
  segments.forEach(([from, to], index) => {
    const startsAt = LINES_START_MS + (index / segments.length) * LINES_DRAW_OVER_MS;
    const drawn = easeOut(clamp01((elapsed - startsAt) / LINE_DRAW_MS));
    const [fromX, fromY] = points[from]!;
    const [toX, toY] = points[to]!;
    const length = Math.hypot(toX - fromX, toY - fromY);
    const clearance = starRadius * FIGURE_LINE_CLEARANCE;
    const visibleLength = (length - clearance * 2) * drawn;
    if (visibleLength <= 0) {
      return;
    }
    const stepX = (toX - fromX) / length;
    const stepY = (toY - fromY) / length;
    ctx.moveTo(fromX + stepX * clearance, fromY + stepY * clearance);
    ctx.lineTo(fromX + stepX * (clearance + visibleLength), fromY + stepY * (clearance + visibleLength));
  });
};

export const paintFigure = (
  ctx: CanvasRenderingContext2D,
  figure: Figure,
  glow: HTMLCanvasElement,
  elapsed: number,
) => {
  const presence = 1 - clamp01((elapsed - FIGURE_COMPLETE_MS) / FIGURE_FADE_MS);

  traceFigureLines(ctx, figure, elapsed);
  ctx.strokeStyle = FIGURE_LINE_TINT;
  ctx.lineCap = 'round';
  for (const { width, alpha } of FIGURE_LINE_STROKES) {
    ctx.globalAlpha = alpha * presence;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  figure.points.forEach((point, index) => {
    const startsAt = (index / figure.points.length) * STARS_IGNITE_OVER_MS;
    const ignition = easeOut(clamp01((elapsed - startsAt) / STAR_IGNITE_MS));
    if (ignition > 0) {
      const radius = figure.starRadius * (index === figure.brightest ? LEAD_STAR_SCALE : 1);
      paintGlow(ctx, glow, ...point, radius * (2 - ignition), ignition * presence);
    }
  });
  ctx.globalAlpha = 1;
};

export const paintMeteor = (
  ctx: CanvasRenderingContext2D,
  meteor: Meteor,
  glow: HTMLCanvasElement,
  progress: number,
) => {
  const stepX = Math.cos(meteor.heading);
  const stepY = Math.sin(meteor.heading);
  const travelled = meteor.distance * progress;
  const tail = Math.min(meteor.tail, travelled);
  const head: Point = [meteor.x + stepX * travelled, meteor.y + stepY * travelled];
  const end: Point = [head[0] - stepX * tail, head[1] - stepY * tail];
  const burn = Math.sin(Math.PI * progress);

  const trail = ctx.createLinearGradient(...end, ...head);
  trail.addColorStop(0, translucent(METEOR_TINT, 0));
  trail.addColorStop(1, '#ffffff');
  ctx.globalAlpha = burn;
  ctx.strokeStyle = trail;
  ctx.lineWidth = METEOR_WIDTH;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(...end);
  ctx.lineTo(...head);
  ctx.stroke();
  paintGlow(ctx, glow, ...head, METEOR_HEAD_RADIUS, burn);
  ctx.globalAlpha = 1;
};
