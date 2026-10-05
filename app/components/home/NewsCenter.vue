<script setup lang="ts">
defineProps<{ tabs: { title: string; bodyHtml: string }[] }>();

const { t } = useI18n();
</script>

<template>
  <section v-if="tabs.length" class="overflow-hidden panel" aria-label="News Center">
    <PanelHeading :constellation-index="0">
      <AppIcon name="star" />
      News Center
    </PanelHeading>
    <div
      class="carousel-tabs"
      :style="{
        '--carousel-previous-label': JSON.stringify(t('HOME_PANELS.CAROUSEL_PREVIOUS')),
        '--carousel-next-label': JSON.stringify(t('HOME_PANELS.CAROUSEL_NEXT')),
      }"
    >
      <article v-for="tab in tabs" :key="tab.title" class="p-5" :style="{ '--slide-title': JSON.stringify(tab.title) }">
        <h3 class="mb-3 heading-display text-lg text-gold-300">{{ tab.title }}</h3>
        <RichContent :html="tab.bodyHtml" />
      </article>
    </div>
  </section>
</template>
