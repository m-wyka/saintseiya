<script setup lang="ts">
const { t } = useI18n();
const { data: categories } = await useFetch('/api/links');

useSeoMeta({ title: () => t('LINKS.TITLE') });
</script>

<template>
  <div>
    <PageHeading :title="t('LINKS.TITLE')" :subtitle="t('LINKS.SUBTITLE')" />
    <div class="flex flex-col gap-8">
      <section v-for="category in categories" :key="category.id">
        <SectionHeading :title="category.name" />
        <ul class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <li v-for="link in category.links" :key="link.id" class="reveal">
            <a
              :href="link.url"
              target="_blank"
              rel="noopener nofollow"
              class="group flex h-full items-start gap-3 panel px-4 py-3 transition duration-300 ease-cosmo hover:-translate-y-0.5 hover:border-cosmo-500/60"
            >
              <span
                class="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-black/40 text-cosmo-500 transition group-hover:cosmo-bar group-hover:text-abyss-950"
              >
                <AppIcon name="link" />
              </span>
              <span class="min-w-0">
                <span class="block font-semibold text-gold-300">{{ link.title }}</span>
                <span v-if="link.description" class="block text-xs text-aqua-300">{{ link.description }}</span>
                <span class="block truncate text-[0.7rem] text-aqua-500">{{ link.url }}</span>
              </span>
            </a>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
