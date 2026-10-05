<script setup lang="ts">
import { CONSTELLATIONS, fitConstellation } from '~/utils/constellations';

const props = defineProps<{ constellationIndex: number }>();

const FIGURE_HEIGHT = 24;
const FIGURE_MAX_WIDTH = 60;
const FIGURE_MARGIN = 4;
const STAR_RADIUS = 0.9;
const BRIGHTEST_STAR_RADIUS = 1.5;
const BRIGHTEST_STAR_HALO_RADIUS = 3.6;

const toTenths = (value: number) => Math.round(value * 10) / 10;

const constellation = computed(() => CONSTELLATIONS.at(props.constellationIndex % CONSTELLATIONS.length)!);

const figure = computed(() => {
  const { paths, brightest } = constellation.value;
  const stars = fitConstellation(
    constellation.value,
    { x: 0, y: 0, width: FIGURE_MAX_WIDTH, height: FIGURE_HEIGHT },
    0,
  ).map(([x, y]) => ({ x: toTenths(x), y: toTenths(y) }));
  const left = Math.min(...stars.map((star) => star.x)) - FIGURE_MARGIN;
  const width = toTenths(Math.max(...stars.map((star) => star.x)) - left + FIGURE_MARGIN);
  const height = FIGURE_HEIGHT + 2 * FIGURE_MARGIN;
  return {
    viewBox: `${toTenths(left)} ${-FIGURE_MARGIN} ${width} ${height}`,
    aspectRatio: `${width} / ${height}`,
    lines: paths.map((path) => `M${path.map((star) => `${stars[star]!.x} ${stars[star]!.y}`).join('L')}`),
    stars,
    brightest: stars[brightest]!,
  };
});
</script>

<template>
  <h2 class="star-banner heading-display text-lg/tight">
    <span class="star-banner-plate"><slot /></span>
    <span class="star-banner-sky">
      <svg
        :viewBox="figure.viewBox"
        class="h-9 shrink-0 fill-white"
        :style="{ aspectRatio: figure.aspectRatio }"
        aria-hidden="true"
      >
        <path
          v-for="line in figure.lines"
          :key="line"
          :d="line"
          pathLength="1"
          class="constellation-trace fill-none stroke-gold-300/70 stroke-[0.7]"
          stroke-linejoin="round"
        />
        <circle
          :cx="figure.brightest.x"
          :cy="figure.brightest.y"
          :r="BRIGHTEST_STAR_HALO_RADIUS"
          class="fill-gold-300/30"
        />
        <circle
          v-for="(star, index) in figure.stars"
          :key="index"
          :cx="star.x"
          :cy="star.y"
          :r="star === figure.brightest ? BRIGHTEST_STAR_RADIUS : STAR_RADIUS"
        />
      </svg>
    </span>
  </h2>
</template>
