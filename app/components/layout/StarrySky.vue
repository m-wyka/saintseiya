<script setup lang="ts">
import {
  FIGURE_COMPLETE_MS,
  GOLD_TINT,
  createGlowSprite,
  paintFigure,
  paintNebula,
  paintStars,
} from '~/utils/skyPainter';
import type { Size } from '~/utils/skyPainter';
import { FIGURE_MIN_GUTTER, figureInGutter, startSkyShow } from '~/utils/skyShow';
import { STAR_TINTS, createSeededRandom, generateStars, starCountFor } from '~/utils/starfield';

const SKY_SEED = 1986;
const MAX_PIXEL_RATIO = 2;
const MAX_CANVAS_PIXELS = 6_000_000;
const LIVE_MIN_GUTTER = 48;
const RESTING_TWINKLER_ALPHA = 0.5;
const REPAINT_DELAY_MS = 150;
const NO_SIZE: Size = { width: 0, height: 0 };

const sky = ref<HTMLElement | null>(null);
const stillCanvas = ref<HTMLCanvasElement | null>(null);
const liveCanvas = ref<HTMLCanvasElement | null>(null);
const pageColumn = ref<HTMLElement | null>(null);
const isPainted = ref(false);

let stopShow = () => {};
let stopWatching = () => {};

const sizedContext = (canvas: HTMLCanvasElement, { width, height }: Size, pixelRatio: number) => {
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  return ctx;
};

const paintSky = (prefersReducedMotion: boolean) => {
  stopShow();
  if (!sky.value || !stillCanvas.value || !liveCanvas.value || !pageColumn.value) {
    return;
  }
  const size: Size = { width: sky.value.clientWidth, height: sky.value.clientHeight };
  const gutter = pageColumn.value.getBoundingClientRect().left;
  // Below this the page covers the sky almost entirely, so nothing would be seen moving.
  const isAnimated = !prefersReducedMotion && gutter >= LIVE_MIN_GUTTER;
  const pixelRatio = Math.min(
    window.devicePixelRatio,
    MAX_PIXEL_RATIO,
    Math.sqrt(MAX_CANVAS_PIXELS / (size.width * size.height)),
  );
  const still = sizedContext(stillCanvas.value, size, pixelRatio);
  const live = sizedContext(liveCanvas.value, isAnimated ? size : NO_SIZE, pixelRatio);
  const random = createSeededRandom(SKY_SEED);
  const starGlows = STAR_TINTS.map(createGlowSprite);
  const goldGlow = createGlowSprite(GOLD_TINT);

  paintNebula(still, size, random);
  const stars = generateStars(starCountFor(size.width, size.height), random);
  paintStars(still, size, stars, starGlows, isAnimated ? RESTING_TWINKLER_ALPHA : 1);

  if (isAnimated) {
    const twinklers = stars.filter((star) => star.twinkleRate > 0);
    stopShow = startSkyShow(live, { size, gutter, twinklers, starGlows, goldGlow });
  } else if (gutter >= FIGURE_MIN_GUTTER) {
    for (const isLeft of [true, false]) {
      paintFigure(still, figureInGutter(size, gutter, isLeft), goldGlow, FIGURE_COMPLETE_MS);
    }
  }
  isPainted.value = true;
};

onMounted(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const repaint = () => paintSky(reducedMotion.matches);
  let repaintTimer: ReturnType<typeof setTimeout> | undefined;
  // Observing fires once straight away, so this also paints the first sky.
  const resizeObserver = new ResizeObserver(() => {
    clearTimeout(repaintTimer);
    repaintTimer = setTimeout(repaint, REPAINT_DELAY_MS);
  });

  resizeObserver.observe(sky.value!);
  reducedMotion.addEventListener('change', repaint);
  stopWatching = () => {
    clearTimeout(repaintTimer);
    resizeObserver.disconnect();
    reducedMotion.removeEventListener('change', repaint);
  };
});

onBeforeUnmount(() => {
  stopWatching();
  stopShow();
});
</script>

<template>
  <div
    ref="sky"
    aria-hidden="true"
    class="pointer-events-none fixed inset-x-0 top-0 -z-1 h-lvh transition-opacity duration-1000 ease-cosmo"
    :class="isPainted ? 'opacity-100' : 'opacity-0'"
  >
    <canvas ref="stillCanvas" class="absolute inset-0 size-full" />
    <canvas ref="liveCanvas" class="absolute inset-0 size-full" />
    <div class="mx-auto max-w-page px-4"><div ref="pageColumn" /></div>
  </div>
</template>
