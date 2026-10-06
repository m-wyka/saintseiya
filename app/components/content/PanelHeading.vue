<script setup lang="ts">
import { CONSTELLATIONS, constellationFigure } from '~/utils/constellations';

const props = defineProps<{ constellationIndex: number }>();

const FIGURE_SIZE = { width: 60, height: 24 };
const FIGURE_MARGIN = 4;
const STAR_RADIUS = 0.9;
const BRIGHTEST_STAR_RADIUS = 1.5;
const BRIGHTEST_STAR_HALO_RADIUS = 3.6;

const figure = computed(() =>
  constellationFigure(CONSTELLATIONS.at(props.constellationIndex % CONSTELLATIONS.length)!, FIGURE_SIZE, FIGURE_MARGIN),
);
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
