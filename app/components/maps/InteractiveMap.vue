<script setup lang="ts">
import type { InternalApi } from 'nitropack';
import { routes } from '#shared/utils/routes';

type InteractiveMapData = InternalApi['/api/maps/:slug']['get'];
type MapArea = InteractiveMapData['areas'][number];

const props = defineProps<{ map: InteractiveMapData }>();

const showsAllAreas = ref(false);
const openedArea = ref<MapArea | null>(null);
const isDialogOpen = computed({
  get: () => openedArea.value !== null,
  set: (isOpen: boolean) => {
    if (!isOpen) {
      openedArea.value = null;
    }
  },
});

const isExternal = (link: string) => /^https?:\/\//.test(link);
const frameOf = (area: MapArea) => ({
  left: `${area.leftPercent}%`,
  top: `${area.topPercent}%`,
  width: `${area.widthPercent}%`,
  height: `${area.heightPercent}%`,
});

const uniqueAreas = computed(() => {
  const seenTargets = new Set<string>();
  return props.map.areas.filter((area) => {
    const target = `${area.label}|${area.link ?? area.id}`;
    if (seenTargets.has(target)) {
      return false;
    }
    seenTargets.add(target);
    return true;
  });
});
</script>

<template>
  <div class="flex flex-col gap-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-aqua-300">Najedź na mapę lub dotknij wybranego miejsca, aby przejść dalej.</p>
      <BaseButton variant="secondary" size="sm" :aria-pressed="showsAllAreas" @click="showsAllAreas = !showsAllAreas">
        <AppIcon name="eye" />
        {{ showsAllAreas ? 'Ukryj obszary' : 'Pokaż wszystkie obszary' }}
      </BaseButton>
    </div>

    <div class="overflow-x-auto panel bg-black p-2">
      <div class="relative mx-auto min-w-3xl" :style="{ maxWidth: `${map.imageWidth}px` }">
        <img
          :src="routes.media(map.image)"
          :alt="map.title"
          :width="map.imageWidth"
          :height="map.imageHeight"
          class="block h-auto w-full animate-rise rounded-lg select-none"
          draggable="false"
        />
        <template v-for="area in map.areas" :key="area.id">
          <button
            v-if="area.contentHtml"
            type="button"
            class="group map-area"
            :class="{ 'map-area-visible': showsAllAreas }"
            :style="frameOf(area)"
            :aria-label="area.label"
            @click="openedArea = area"
          >
            <span class="map-area-label">{{ area.label }}</span>
          </button>
          <NuxtLink
            v-else-if="area.link"
            :to="area.link"
            :target="isExternal(area.link) ? '_blank' : undefined"
            :rel="isExternal(area.link) ? 'noopener' : undefined"
            class="group map-area"
            :class="{ 'map-area-visible': showsAllAreas }"
            :style="frameOf(area)"
            :aria-label="area.label"
          >
            <span class="map-area-label">{{ area.label }}</span>
          </NuxtLink>
        </template>
      </div>
    </div>

    <section aria-labelledby="map-areas-heading">
      <SectionHeading id="map-areas-heading" title="Miejsca na mapie" />
      <ul class="flex flex-wrap gap-2">
        <li v-for="area in uniqueAreas" :key="area.id">
          <button
            v-if="area.contentHtml"
            type="button"
            class="cursor-pointer rounded-full border border-aqua-500/30 px-3 py-1 text-xs text-aqua-200 transition duration-200 hover:border-cosmo-500 hover:text-gold-300"
            @click="openedArea = area"
          >
            {{ area.label }}
          </button>
          <NuxtLink
            v-else-if="area.link"
            :to="area.link"
            class="block rounded-full border border-aqua-500/30 px-3 py-1 text-xs text-aqua-200 transition duration-200 hover:border-cosmo-500 hover:text-gold-300"
          >
            {{ area.label }}
          </NuxtLink>
        </li>
      </ul>
    </section>

    <BaseDialog v-model="isDialogOpen" :title="openedArea?.label ?? ''">
      <RichContent v-if="openedArea?.contentHtml" :html="openedArea.contentHtml" />
    </BaseDialog>
  </div>
</template>
