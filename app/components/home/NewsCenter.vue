<script setup lang="ts">
defineProps<{ tabs: { title: string; bodyHtml: string }[] }>();

const { t } = useI18n();
const slides = useTemplateRef('slides');
const activeIndex = ref(0);

const show = (index: number) => {
  slides.value?.scrollTo({ left: index * slides.value.clientWidth });
};

// Swiping the slides or tabbing into a hidden one moves them too, so the strip follows the scroll position.
const followScroll = () => {
  if (slides.value) {
    activeIndex.value = Math.round(slides.value.scrollLeft / slides.value.clientWidth);
  }
};
</script>

<template>
  <section v-if="tabs.length" class="overflow-hidden panel" aria-label="News Center">
    <PanelHeading :constellation-index="0">
      <AppIcon name="star" />
      News Center
    </PanelHeading>
    <div
      v-if="tabs.length > 1"
      class="carousel-strip flex h-11 items-center gap-1 border-b border-aqua-500/20 bg-black/30 px-3"
      role="group"
      :aria-label="t('HOME_PANELS.NEWS_CENTER_TABS')"
    >
      <button
        v-for="(tab, index) in tabs"
        :key="tab.title"
        type="button"
        class="shrink-0 cursor-pointer rounded-md px-3 py-1 text-xs font-semibold whitespace-nowrap transition duration-200"
        :class="index === activeIndex ? 'bg-cosmo-500 text-abyss-950' : 'text-aqua-300 hover:text-gold-300'"
        :aria-current="index === activeIndex ? 'true' : undefined"
        @click="show(index)"
      >
        {{ tab.title }}
      </button>
    </div>
    <div ref="slides" class="carousel-slides" @scroll.passive="followScroll">
      <article v-for="tab in tabs" :key="tab.title" class="p-5">
        <h3 class="mb-3 heading-display text-lg text-gold-300">{{ tab.title }}</h3>
        <RichContent :html="tab.bodyHtml" />
      </article>
    </div>
  </section>
</template>
