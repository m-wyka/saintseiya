<script setup lang="ts">
import { routes } from '#shared/utils/routes';

const PARTNERS = [
  {
    nameKey: 'FOOTER.PARTNER_RYUUTSURU_TEIKOKU',
    url: 'http://ryuutsuruteikoku.eu/',
    image: '/theme/partners/ryuutsuru-teikoku.png',
  },
  {
    nameKey: 'FOOTER.PARTNER_SAINT_SEIYA_LEGENDS',
    url: 'http://saintseiyalegends.bestdiscussion.net/',
    image: '/theme/partners/saint-seiya-legends.png',
  },
];
const FOUNDING_YEAR = 2006;
const layout = useLayoutStore();
const { t } = useI18n();
const currentYear = new Date().getFullYear();
</script>

<template>
  <footer class="mt-12 border-t border-cosmo-500/30 bg-abyss-950/80">
    <div class="mx-auto flex max-w-page flex-col gap-6 px-4 py-8">
      <section v-if="layout.maps.length" aria-labelledby="projects-heading">
        <h2 id="projects-heading" class="mb-4 text-center heading-display text-lg text-gold-300">
          {{ t('FOOTER.PROJECTS') }}
        </h2>
        <ul class="flex flex-wrap items-end justify-center gap-x-8 gap-y-4">
          <li v-for="map in layout.maps" :key="map.slug">
            <NuxtLinkLocale
              :to="routes.map(map.slug)"
              class="group flex flex-col items-center gap-1 text-xs text-aqua-300 transition duration-300 ease-cosmo hover:-translate-y-1 hover:text-gold-300"
            >
              <img
                v-if="map.teaserImage"
                :src="routes.media(map.teaserImage)"
                :alt="map.title"
                loading="lazy"
                class="h-24 w-auto opacity-60 grayscale transition duration-500 ease-cosmo group-hover:opacity-100 group-hover:grayscale-0"
              />
              <span
                v-else
                class="grid size-24 place-items-center rounded-full border border-aqua-500/30 text-3xl text-cosmo-500"
              >
                <AppIcon name="map" />
              </span>
              {{ map.title }}
            </NuxtLinkLocale>
          </li>
        </ul>
      </section>
      <ul class="flex flex-wrap items-center justify-center gap-4">
        <li v-for="partner in PARTNERS" :key="partner.url">
          <a
            :href="partner.url"
            target="_blank"
            rel="noopener"
            class="block opacity-60 grayscale transition duration-300 ease-cosmo hover:scale-105 hover:opacity-100 hover:grayscale-0"
          >
            <img :src="partner.image" :alt="t(partner.nameKey)" class="h-10 w-auto" loading="lazy" />
          </a>
        </li>
      </ul>
      <div class="flex flex-wrap items-center justify-between gap-3 text-xs text-aqua-500">
        <p>
          © <strong class="text-aqua-200">Saint Seiya Revolution</strong> {{ FOUNDING_YEAR }}–{{ currentYear }}.
          {{ t('FOOTER.TAGLINE') }}
        </p>
        <p>Saint Seiya © Masami Kurumada, Shueisha, Toei Animation.</p>
      </div>
    </div>
  </footer>
</template>
