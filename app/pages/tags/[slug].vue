<script setup lang="ts">
import { routes } from '#shared/utils/routes';

const route = useRoute('tagi-slug');
const { data: tag, error } = await useFetch(() => `/api/tags/${route.params.slug}`);

if (error.value || !tag.value) {
  throw createError({ statusCode: error.value?.statusCode ?? 404, statusMessage: 'Nie znaleziono tagu', fatal: true });
}

useSeoMeta({ title: () => `Tag: ${tag.value?.name ?? ''}` });
</script>

<template>
  <div v-if="tag">
    <PageHeading :title="tag.name" subtitle="Treści oznaczone tym tagiem." />
    <section v-if="tag.pages.length" class="mb-8">
      <SectionHeading title="Podstrony" />
      <ul class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <li v-for="page in tag.pages" :key="page.path">
          <NuxtLink
            :to="routes.page(page.path)"
            class="block panel px-4 py-3 text-sm font-semibold text-aqua-200 transition duration-300 ease-cosmo hover:-translate-y-0.5 hover:border-cosmo-500/60 hover:text-gold-300"
          >
            {{ page.title }}
            <span class="block text-[0.7rem] font-normal text-aqua-500">/{{ page.path }}</span>
          </NuxtLink>
        </li>
      </ul>
    </section>
    <section>
      <SectionHeading title="Newsy" />
      <NewsListing :tag-slug="tag.slug" />
    </section>
  </div>
</template>
