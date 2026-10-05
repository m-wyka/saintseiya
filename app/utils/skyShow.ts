import { CONSTELLATIONS, fitConstellation, segmentsOf } from './constellations';
import type { Constellation } from './constellations';
import { FIGURE_LIFETIME_MS, isFigureMoving, paintFigure, paintMeteor, paintTwinkles } from './skyPainter';
import type { Figure, Meteor, Size } from './skyPainter';
import { between } from './starfield';
import type { Star } from './starfield';

export interface SkyScene {
  size: Size;
  gutter: number;
  twinklers: Star[];
  starGlows: HTMLCanvasElement[];
  goldGlow: HTMLCanvasElement;
}

interface ShownFigure {
  figure: Figure;
  startedAt: number;
}

interface FlyingMeteor extends Meteor {
  startsAt: number;
  duration: number;
}

export const FIGURE_MIN_GUTTER = 80;

const FIGURE_MARGIN = 8;
const FIGURE_MAX_SPAN = 340;
const FIGURE_MAX_HEIGHT_SHARE = 0.55;
const FIGURE_STAR_RADIUS_SHARE = 0.045;
const FIGURE_MIN_STAR_RADIUS = 5;
const FIGURE_MAX_STAR_RADIUS = 13;
const FIRST_FIGURE_AFTER_MS = 2500;
const FIGURE_PAUSE_MS = [4000, 9000] as const;

const METEOR_HEADING = Math.PI / 2 + 0.44;
const METEOR_HEADING_JITTER = 0.1;
const METEOR_PAUSE_MS = [8000, 20_000] as const;
const METEOR_SHOWER_CHANCE = 0.12;
const METEOR_SHOWER_GAP_MS = 90;

const IDLE_FRAME_MS = 40;
const LONGEST_FRAME_MS = 100;

const chance = (min: number, max: number): number => between(Math.random, min, max);

let deck: Constellation[] = [];

const nextConstellation = (): Constellation => {
  if (!deck.length) {
    deck = CONSTELLATIONS.map((constellation) => ({ constellation, order: Math.random() }))
      .sort((first, second) => first.order - second.order)
      .map(({ constellation }) => constellation);
  }
  return deck.pop()!;
};

export const figureInGutter = ({ width, height }: Size, gutter: number, isLeft: boolean): Figure => {
  const constellation = nextConstellation();
  const boxWidth = Math.min(gutter - FIGURE_MARGIN * 2, FIGURE_MAX_SPAN);
  const boxHeight = Math.min(height * FIGURE_MAX_HEIGHT_SHARE, FIGURE_MAX_SPAN);
  const box = {
    x: (isLeft ? 0 : width - gutter) + chance(FIGURE_MARGIN, gutter - FIGURE_MARGIN - boxWidth),
    y: chance(height * 0.1, height * 0.9 - boxHeight),
    width: boxWidth,
    height: boxHeight,
  };
  return {
    points: fitConstellation(constellation, box, chance(0, Math.PI * 2)),
    segments: segmentsOf(constellation),
    brightest: constellation.brightest,
    starRadius: Math.min(FIGURE_MAX_STAR_RADIUS, Math.max(FIGURE_MIN_STAR_RADIUS, boxWidth * FIGURE_STAR_RADIUS_SHARE)),
  };
};

const meteorsFrom = ({ size, gutter }: SkyScene, clock: number): FlyingMeteor[] => {
  const isLeft = Math.random() < 0.5;
  const originX = isLeft ? chance(gutter * 0.4, gutter) : size.width - chance(0, gutter * 0.6);
  const originY = chance(-0.05, 0.5) * size.height;
  const heading = METEOR_HEADING + chance(-METEOR_HEADING_JITTER, METEOR_HEADING_JITTER);
  const count = Math.random() < METEOR_SHOWER_CHANCE ? Math.round(chance(4, 7)) : 1;
  return Array.from({ length: count }, (_, index) => ({
    x: originX + (index ? chance(-gutter / 3, gutter / 3) : 0),
    y: originY + (index ? chance(-80, 80) : 0),
    heading,
    distance: chance(180, 380),
    tail: chance(90, 170),
    startsAt: clock + index * METEOR_SHOWER_GAP_MS,
    duration: chance(700, 1100),
  }));
};

export const startSkyShow = (ctx: CanvasRenderingContext2D, scene: SkyScene): (() => void) => {
  const { size, gutter } = scene;
  let frameRequest = 0;
  let previousFrameAt = performance.now();
  let clock = 0;
  let shown: ShownFigure | null = null;
  let isLeftTurn = Math.random() < 0.5;
  let nextFigureAt = FIRST_FIGURE_AFTER_MS;
  let nextMeteorAt = chance(...METEOR_PAUSE_MS);
  let meteors: FlyingMeteor[] = [];

  const advance = () => {
    if (shown && clock - shown.startedAt >= FIGURE_LIFETIME_MS) {
      shown = null;
      nextFigureAt = clock + chance(...FIGURE_PAUSE_MS);
    }
    if (!shown && clock >= nextFigureAt && gutter >= FIGURE_MIN_GUTTER) {
      shown = { figure: figureInGutter(size, gutter, isLeftTurn), startedAt: clock };
      isLeftTurn = !isLeftTurn;
    }
    meteors = meteors.filter((meteor) => clock < meteor.startsAt + meteor.duration);
    if (clock >= nextMeteorAt) {
      meteors.push(...meteorsFrom(scene, clock));
      nextMeteorAt = clock + chance(...METEOR_PAUSE_MS);
    }
  };

  const paint = () => {
    ctx.clearRect(0, 0, size.width, size.height);
    paintTwinkles(ctx, size, scene.twinklers, scene.starGlows, clock / 1000);
    if (shown) {
      paintFigure(ctx, shown.figure, scene.goldGlow, clock - shown.startedAt);
    }
    for (const meteor of meteors) {
      const progress = (clock - meteor.startsAt) / meteor.duration;
      if (progress > 0) {
        paintMeteor(ctx, meteor, scene.goldGlow, progress);
      }
    }
  };

  const onFrame = (now: number) => {
    frameRequest = requestAnimationFrame(onFrame);
    const sinceLastFrame = now - previousFrameAt;
    // Twinkling is slow enough to repaint every 40 ms; a meteor in flight or a figure being drawn needs every frame.
    const isMoving = meteors.length > 0 || (shown !== null && isFigureMoving(clock - shown.startedAt));
    if (!isMoving && sinceLastFrame < IDLE_FRAME_MS) {
      return;
    }
    previousFrameAt = now;
    clock += Math.min(sinceLastFrame, LONGEST_FRAME_MS);
    advance();
    paint();
  };

  frameRequest = requestAnimationFrame(onFrame);
  return () => cancelAnimationFrame(frameRequest);
};
