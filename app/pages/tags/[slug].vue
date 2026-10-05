<script setup lang="ts">
import { routes } from '#shared/utils/routes';

const { t } = useI18n();
const routeSlug = useRouteParam('slug');
const { data: tag, error } = await useFetch(() => `/api/tags/${routeSlug.value}`);

if (error.value || !tag.value) {
  throw createError({ statusCode: error.value?.statusCode ?? 404, statusMessage: t('TAGS.NOT_FOUND'), fatal: true });
}

useSeoMeta({ title: () => t('TAGS.SEO_TITLE', { name: tag.value?.name ?? '' }) });
</script>

<template>
  <div v-if="tag">
    <PageHeading :title="tag.name" :subtitle="t('TAGS.SUBTITLE')" />
    <section v-if="tag.pages.length" class="mb-8">
      <SectionHeading :title="t('TAGS.PAGES')" />
      <ul class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <li v-for="page in tag.pages" :key="page.path">
          <NuxtLinkLocale
            :to="routes.page(page.path)"
            class="block panel px-4 py-3 text-sm font-semibold text-aqua-200 transition duration-300 ease-cosmo hover:-translate-y-0.5 hover:border-cosmo-500/60 hover:text-gold-300"
          >
            {{ page.title }}
            <span class="block text-[0.7rem] font-normal text-aqua-500">/{{ page.path }}</span>
          </NuxtLinkLocale>
        </li>
      </ul>
    </section>
    <section>
      <SectionHeading :title="t('GENERAL.NEWS')" />
      <NewsListing :tag-slug="tag.slug" />
    </section>
  </div>
</template>
