<script setup lang="ts">
import { withLocalePrefix } from '#shared/utils/locales';
import { routes } from '#shared/utils/routes';

const PARTNERS = [
  {
    nameKey: 'FOOTER.PARTNER_RYUUTSURU_TEIKOKU',
    url: 'http://ryuutsuruteikoku.eu/',
    image: '/theme/partners/ryuutsuru-teikoku.png',
    width: 280,
  },
  {
    nameKey: 'FOOTER.PARTNER_SAINT_SEIYA_LEGENDS',
    url: 'http://saintseiyalegends.bestdiscussion.net/',
    image: '/theme/partners/saint-seiya-legends.png',
    width: 251,
  },
];
const PARTNER_IMAGE_HEIGHT = 42;
const FOUNDING_YEAR = 2006;
const layout = useLayoutStore();
const { t, locale } = useI18n();
const currentYear = new Date().getFullYear();
</script>

<template>
  <footer class="mt-12 border-t border-cosmo-500/30 bg-abyss-950/80">
    <div class="mx-auto flex max-w-page flex-col gap-6 px-4 py-8">
      <section v-if="layout.maps.length" aria-labelledby="projects-heading">
        <h2 id="projects-heading" class="mb-4 text-center heading-display text-lg text-gold-300">
          {{ t('FOOTER.PROJECTS') }}
        </h2>
        <ul class="flex flex-wrap items-start justify-center gap-4">
          <li v-for="map in layout.maps" :key="map.slug">
            <NuxtLinkLocale
              :to="routes.map(map.slug)"
              class="group flex w-40 flex-col items-center gap-2 text-xs text-aqua-300 transition duration-300 ease-cosmo hover:-translate-y-1 hover:text-gold-300"
            >
              <!-- One frame for every project, whatever the size and shape of its legacy picture. -->
              <span
                class="relative flex h-24 w-full items-center justify-center overflow-hidden rounded-lg border border-aqua-500/25 bg-black/40 text-3xl text-cosmo-500 transition duration-300 group-hover:border-cosmo-500/60"
              >
                <img
                  v-if="map.teaserImage ?? map.image"
                  :src="routes.media(map.teaserImage ?? map.image)"
                  alt=""
                  loading="lazy"
                  class="absolute inset-0 size-full opacity-60 grayscale transition duration-500 ease-cosmo group-hover:opacity-100 group-hover:grayscale-0"
                  :class="map.teaserImage ? 'object-contain p-1.5' : 'object-cover'"
                />
                <AppIcon v-else name="map" />
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
            <img
              :src="partner.image"
              :alt="t(partner.nameKey)"
              :width="partner.width"
              :height="PARTNER_IMAGE_HEIGHT"
              class="h-10 w-auto"
              loading="lazy"
            />
          </a>
        </li>
      </ul>
      <div class="flex flex-wrap items-center justify-between gap-3 text-xs text-aqua-500">
        <p>
          © <strong class="text-aqua-200">Saint Seiya Revolution</strong> {{ FOUNDING_YEAR }}–{{ currentYear }}.
          {{ t('FOOTER.TAGLINE') }}
          <a
            :href="withLocalePrefix(routes.newsFeed(), locale)"
            class="ml-2 inline-flex items-center gap-1 text-aqua-300 transition duration-200 hover:text-gold-300"
          >
            <AppIcon name="rss" />
            {{ t('FOOTER.NEWS_FEED') }}
          </a>
        </p>
        <p>Saint Seiya © Masami Kurumada, Shueisha, Toei Animation.</p>
      </div>
    </div>
  </footer>
</template>
