<script setup lang="ts">
import { routes } from '#shared/utils/routes';
import { CONSTELLATIONS, constellationFigure } from '~/utils/constellations';
import { zodiacSignOf } from '~/utils/zodiac';

const props = defineProps<{ publishedAt: string | null; categoryImage?: string | null; featured?: boolean }>();

const FIGURE_SIZE = { width: 120, height: 72 };
const FIGURE_MARGIN = 6;
const STAR_RADIUS = 1.3;
const BRIGHTEST_STAR_RADIUS = 2.2;
const BRIGHTEST_STAR_HALO_RADIUS = 5.5;
const UNDATED_CONSTELLATION_ID = 'pegasus';

const { t } = useI18n();

const sign = computed(() => (props.publishedAt ? zodiacSignOf(props.publishedAt) : null));

const figure = computed(() =>
  constellationFigure(
    sign.value?.constellation ?? CONSTELLATIONS.find((candidate) => candidate.id === UNDATED_CONSTELLATION_ID)!,
    FIGURE_SIZE,
    FIGURE_MARGIN,
  ),
);

const coverImage = computed(() => props.categoryImage && routes.media(props.categoryImage));
</script>

<template>
  <div
    class="star-chart h-28 items-center gap-4 px-4 py-2.5"
    :class="{ '@md:h-auto @md:min-h-56 @md:flex-1 @md:gap-8 @md:px-8': featured }"
  >
    <span
      v-if="coverImage"
      class="relative h-20 shrink-0 -rotate-3 transition duration-500 ease-cosmo group-hover:scale-105 group-hover:rotate-0"
      :class="{ '@md:h-44': featured }"
    >
      <img
        :src="coverImage"
        alt=""
        loading="lazy"
        class="absolute inset-0 -z-1 size-full scale-125 opacity-75 blur-xl saturate-200 transition duration-500 ease-cosmo group-hover:scale-150 group-hover:opacity-100"
        aria-hidden="true"
      />
      <span class="prism-glint block h-full rounded-md border border-gold-300/60">
        <img
          :src="coverImage"
          alt=""
          width="150"
          height="200"
          loading="lazy"
          class="aspect-3/4 h-full w-auto max-w-none object-cover"
        />
      </span>
    </span>

    <div
      class="flex min-w-0 flex-col gap-1"
      :class="coverImage ? 'ml-auto items-end text-right' : 'mx-auto items-center text-center'"
    >
      <svg
        :viewBox="figure.viewBox"
        class="h-14 max-w-full shrink-0 overflow-visible fill-white"
        :class="{ '@md:h-40': featured }"
        :style="{ aspectRatio: figure.aspectRatio }"
        aria-hidden="true"
      >
        <g class="fill-none stroke-1" :class="{ '@md:stroke-[0.5]': featured }" stroke-linejoin="round">
          <path v-for="line in figure.lines" :key="line" :d="line" class="stroke-aqua-300/45" />
          <path
            v-for="line in figure.lines"
            :key="`ignited ${line}`"
            :d="line"
            pathLength="1"
            class="stroke-gold-300 transition-[stroke-dashoffset] duration-1000 ease-cosmo [stroke-dasharray:1] [stroke-dashoffset:1] group-focus-within:[stroke-dashoffset:0] group-hover:[stroke-dashoffset:0]"
          />
        </g>
        <circle
          :cx="figure.brightest.x"
          :cy="figure.brightest.y"
          :r="BRIGHTEST_STAR_HALO_RADIUS"
          class="origin-center fill-gold-300/30 transition duration-500 ease-cosmo transform-fill group-hover:scale-150 group-hover:fill-gold-300/45"
        />
        <circle
          v-for="(star, index) in figure.stars"
          :key="index"
          :cx="star.x"
          :cy="star.y"
          :r="star === figure.brightest ? BRIGHTEST_STAR_RADIUS : STAR_RADIUS"
        />
      </svg>
      <p class="leading-tight">
        <span v-if="sign" class="block heading-display text-sm text-gold-200" :class="{ '@md:text-xl': featured }">
          {{ t(sign.nameKey) }}
        </span>
        <time
          v-if="publishedAt"
          :datetime="publishedAt"
          class="text-[0.7rem] text-aqua-300"
          :class="{ '@md:text-sm': featured }"
        >
          {{ formatLongDate(publishedAt) }}
        </time>
      </p>
    </div>
  </div>
</template>
