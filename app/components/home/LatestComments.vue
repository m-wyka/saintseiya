<script setup lang="ts">
import type { InternalApi } from 'nitropack';
import { constellationFigure } from '~/utils/constellations';
import { zodiacSignOf } from '~/utils/zodiac';

type CommentSummary = InternalApi['/api/home']['get']['latestComments'][number];

const props = defineProps<{ comments: CommentSummary[] }>();

const FIGURE_SIZE = { width: 120, height: 72 };
const FIGURE_MARGIN = 6;
const STAR_RADIUS = 1.3;
const BRIGHTEST_STAR_RADIUS = 2.2;
const BRIGHTEST_STAR_HALO_RADIUS = 5.5;
const ARROW_KEY_STEPS: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

const { t } = useI18n();
const sectionId = useId();
const headingId = `${sectionId}-heading`;
const activeIndex = ref(0);

const voices = computed(() =>
  props.comments.map((comment) => {
    const sign = zodiacSignOf(comment.createdAt);
    return { comment, sign, figure: constellationFigure(sign.constellation, FIGURE_SIZE, FIGURE_MARGIN) };
  }),
);

const tabId = (index: number) => `${sectionId}-tab-${index}`;
const panelId = (index: number) => `${sectionId}-panel-${index}`;

const activateWithMouse = (event: PointerEvent, index: number) => {
  if (event.pointerType === 'mouse') {
    activeIndex.value = index;
  }
};

const indexForKey = (key: string): number | undefined => {
  const count = props.comments.length;
  if (key === 'Home') {
    return 0;
  }
  if (key === 'End') {
    return count - 1;
  }
  const step = ARROW_KEY_STEPS[key];
  return step === undefined ? undefined : (activeIndex.value + step + count) % count;
};

// Focusing a tab activates it, so moving the focus is all the arrow keys have to do.
const moveWithKeyboard = (event: KeyboardEvent) => {
  const index = indexForKey(event.key);
  if (index !== undefined) {
    event.preventDefault();
    document.getElementById(tabId(index))?.focus();
  }
};
</script>

<template>
  <section v-if="comments.length" class="@container reveal stage p-4 @xl:p-6" :aria-labelledby="headingId">
    <SectionHeading :id="headingId" :title="t('HOME_PANELS.LATEST_COMMENTS')" />
    <div class="flex flex-col @xl:flex-row">
      <div
        role="tablist"
        :aria-labelledby="headingId"
        class="relative z-10 grid auto-cols-fr grid-flow-col @xl:w-60 @xl:shrink-0 @xl:grid-flow-row @xl:auto-rows-fr"
        :style="{ '--item-count': comments.length, '--active-index': activeIndex }"
        @keydown="moveWithKeyboard"
      >
        <span
          class="sliding-thumb-x -mb-px rounded-t-lg border border-b-0 border-aqua-500/25 border-t-cosmo-500 bg-abyss-600 @xl:sliding-thumb-y @xl:-mr-px @xl:mb-0 @xl:rounded-l-lg @xl:rounded-tr-none @xl:border-r-0 @xl:border-b @xl:border-t-aqua-500/25 @xl:border-l-cosmo-500"
          aria-hidden="true"
        />
        <button
          v-for="({ comment }, index) in voices"
          :id="tabId(index)"
          :key="comment.id"
          role="tab"
          type="button"
          :aria-selected="index === activeIndex"
          :aria-controls="panelId(index)"
          :tabindex="index === activeIndex ? 0 : -1"
          class="group relative flex min-h-13 cursor-pointer items-center justify-center gap-3 px-1 text-left @xl:justify-start @xl:px-3"
          @click="activeIndex = index"
          @focus="activeIndex = index"
          @pointerenter="activateWithMouse($event, index)"
        >
          <span
            class="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full border bg-black/30 font-display text-sm font-bold transition duration-300 ease-cosmo group-aria-selected:border-cosmo-400 group-aria-selected:text-gold-100 group-aria-selected:shadow-aura"
            :class="comment.author.isGhost ? 'border-aqua-500/40 text-aqua-300' : 'border-gold-300/50 text-gold-300'"
            aria-hidden="true"
          >
            <img
              v-if="comment.author.avatarUrl"
              :src="comment.author.avatarUrl"
              alt=""
              loading="lazy"
              referrerpolicy="no-referrer"
              class="size-full object-cover"
            />
            <template v-else>{{ initialsOf(comment.author.name) }}</template>
          </span>
          <span class="min-w-0 @max-xl:sr-only">
            <span
              class="block truncate text-sm font-semibold text-aqua-200 transition duration-300 group-aria-selected:text-gold-300"
            >
              {{ comment.author.name }}
            </span>
            <span
              class="block truncate text-[0.7rem] text-aqua-500 transition duration-300 group-aria-selected:text-aqua-300"
            >
              {{ translateMessage(comment.target.title) }}
            </span>
          </span>
        </button>
      </div>

      <div
        class="grid min-w-0 flex-1 rounded-b-xl border border-aqua-500/25 bg-abyss-600 @xl:rounded-tr-xl @xl:rounded-bl-none"
      >
        <article
          v-for="({ comment, sign, figure }, index) in voices"
          v-show="index === activeIndex"
          :id="panelId(index)"
          :key="comment.id"
          role="tabpanel"
          :aria-labelledby="tabId(index)"
          class="grid animate-[rise_0.4s_var(--ease-cosmo)_both] grid-cols-[minmax(0,1fr)_auto] grid-rows-[1fr_auto_auto] gap-x-5 gap-y-1.5 p-4 @xl:p-6"
        >
          <blockquote class="col-span-2 pb-3 text-base/7 text-pretty text-mist @xl:col-span-1 @xl:text-xl/9">
            {{ t('HOME_PANELS.QUOTE', { text: comment.excerpt }) }}
          </blockquote>

          <div
            class="col-start-2 row-start-2 flex flex-col items-end justify-between gap-1 text-right @xl:row-span-3 @xl:row-start-1"
          >
            <svg
              :viewBox="figure.viewBox"
              class="h-12 max-w-full shrink-0 overflow-visible fill-white @xl:h-28"
              :style="{ aspectRatio: figure.aspectRatio }"
              aria-hidden="true"
            >
              <g class="fill-none stroke-[0.9] @xl:stroke-[0.6]" stroke-linejoin="round">
                <path v-for="line in figure.lines" :key="line" :d="line" class="stroke-aqua-300/45" />
                <path
                  v-for="line in figure.lines"
                  :key="`ignited ${line}`"
                  :d="line"
                  pathLength="1"
                  class="constellation-trace stroke-gold-300"
                />
              </g>
              <circle
                :cx="figure.brightest.x"
                :cy="figure.brightest.y"
                :r="BRIGHTEST_STAR_HALO_RADIUS"
                class="fill-gold-300/30"
              />
              <circle
                v-for="(star, starIndex) in figure.stars"
                :key="starIndex"
                :cx="star.x"
                :cy="star.y"
                :r="star === figure.brightest ? BRIGHTEST_STAR_RADIUS : STAR_RADIUS"
              />
            </svg>
            <p class="leading-tight">
              <span class="block heading-display text-sm text-gold-200">{{ t(sign.nameKey) }}</span>
              <time :datetime="comment.createdAt" class="text-[0.7rem] text-aqua-300">
                {{ formatLongDate(comment.createdAt) }}
              </time>
            </p>
          </div>

          <p class="col-start-1 row-start-2 min-w-0 self-end text-sm">
            <AuthorName :author="comment.author" />
          </p>
          <NuxtLinkLocale
            :to="comment.target.url"
            class="group col-span-2 row-start-3 flex max-w-full min-w-0 items-center gap-1.5 justify-self-start text-sm text-aqua-300 transition hover:text-gold-300 @xl:col-span-1"
          >
            <AppIcon name="comment" class="text-cosmo-500" />
            <span class="shrink-0">{{ t('HOME_PANELS.COMMENTED_ON') }}</span>
            <span class="truncate font-semibold text-cosmo-400 transition group-hover:text-gold-300">
              {{ translateMessage(comment.target.title) }}
            </span>
            <AppIcon name="chevronRight" class="transition duration-200 group-hover:translate-x-0.5" />
          </NuxtLinkLocale>
        </article>
      </div>
    </div>
  </section>
</template>
