<script setup lang="ts">
import { CONSTELLATIONS } from '~/utils/constellations';

const layout = useLayoutStore();

// The five Bronze Saints' constellations follow Pegasus in the list, one for each side panel.
const pegasusIndex = CONSTELLATIONS.findIndex(({ id }) => id === 'pegasus');

type NavigationLink = (typeof layout.navigation)[number]['links'][number];

const groupedLinks = (links: NavigationLink[]) => {
  const groups: { title: string | null; links: NavigationLink[] }[] = [];
  for (const link of links) {
    const current = groups[groups.length - 1];
    if (current && current.title === link.groupTitle) {
      current.links.push(link);
    } else {
      groups.push({ title: link.groupTitle, links: [link] });
    }
  }
  return groups;
};

const isExternal = (url: string) => /^https?:\/\//.test(url);
</script>

<template>
  <div class="flex flex-col gap-5">
    <section
      v-for="(section, sectionIndex) in layout.navigation"
      :key="section.id"
      class="overflow-hidden panel"
      :style="{ '--banner-order': sectionIndex }"
    >
      <PanelHeading :constellation-index="pegasusIndex + sectionIndex">{{ section.title }}</PanelHeading>
      <div class="flex flex-col gap-1 p-2">
        <div v-for="(group, groupIndex) in groupedLinks(section.links)" :key="groupIndex">
          <h3
            v-if="group.title"
            class="mx-3 mt-3 mb-1 border-b border-cosmo-500/30 pb-1 heading-display text-sm font-bold text-cosmo-400"
          >
            {{ group.title }}
          </h3>
          <ul class="flex flex-col gap-0.5">
            <li v-for="link in group.links" :key="link.id">
              <NuxtLinkLocale
                :to="link.url"
                :target="isExternal(link.url) ? '_blank' : undefined"
                :rel="isExternal(link.url) ? 'noopener' : undefined"
                class="flex gap-2 rounded-md px-3 py-1.5 text-sm text-aqua-200 transition duration-200 hover:bg-white/5 hover:text-gold-300"
                active-class="bg-white/5 text-gold-300"
              >
                <span class="mt-2 size-1 shrink-0 rounded-full bg-cosmo-500" aria-hidden="true" />
                <span class="min-w-0 flex-1">{{ link.label }}</span>
                <AppIcon v-if="isExternal(link.url)" name="external" class="text-xs text-aqua-500" />
              </NuxtLinkLocale>
            </li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>
