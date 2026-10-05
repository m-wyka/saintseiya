<script setup lang="ts">
import type { InternalApi } from 'nitropack';
import { routes } from '#shared/utils/routes';

type NewsSummary = InternalApi['/api/news']['get']['items'][number];

defineProps<{ news: NewsSummary }>();
</script>

<template>
  <article
    class="group relative reveal overflow-hidden panel transition duration-300 ease-cosmo hover:border-cosmo-500/50 hover:shadow-aura"
  >
    <header class="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-aqua-500/15 bg-black/30 px-5 py-3">
      <h3 class="min-w-0 flex-1 heading-display text-xl/snug text-gold-300">
        <NuxtLink :to="routes.news(news.slug)" class="transition after:absolute after:inset-0 hover:text-cosmo-400">
          {{ news.title }}
        </NuxtLink>
      </h3>
      <NuxtLink
        v-if="news.category"
        :to="routes.newsCategory(news.category.slug)"
        class="relative z-10 rounded-full border border-cosmo-500/40 px-2.5 py-0.5 text-[0.7rem] font-semibold tracking-wide text-cosmo-400 uppercase transition hover:bg-cosmo-500/15"
      >
        {{ news.category.name }}
      </NuxtLink>
    </header>

    <div class="flex gap-5 p-5 max-sm:flex-col">
      <img
        v-if="news.category?.image"
        :src="routes.media(news.category.image)"
        :alt="news.category.name"
        width="150"
        height="200"
        loading="lazy"
        class="h-40 w-30 shrink-0 rounded-lg border border-gold-300/40 object-cover shadow-panel transition duration-500 ease-cosmo group-hover:scale-[1.03] group-hover:-rotate-1 max-sm:h-28 max-sm:w-21"
      />
      <RichContent :html="news.excerptHtml" class="relative z-10 min-w-0 flex-1" />
    </div>

    <footer
      class="flex flex-wrap items-center justify-between gap-3 border-t border-aqua-500/15 px-5 py-3 text-xs text-aqua-300"
    >
      <p class="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span class="flex items-center gap-1.5">
          <AppIcon name="user" class="text-cosmo-500" />
          <AuthorName :author="news.author" />
        </span>
        <time v-if="news.publishedAt" :datetime="news.publishedAt" class="flex items-center gap-1.5">
          <AppIcon name="calendar" class="text-cosmo-500" />
          {{ formatLongDate(news.publishedAt) }}
        </time>
        <span class="flex items-center gap-1.5">
          <AppIcon name="comment" class="text-cosmo-500" />
          {{ pluralize(news.commentCount, 'komentarz', 'komentarze', 'komentarzy') }}
        </span>
      </p>
      <span
        class="flex items-center gap-1.5 font-semibold text-cosmo-400 transition duration-200 group-hover:gap-2.5 group-hover:text-gold-300"
      >
        {{ news.hasBody ? 'Czytaj więcej' : 'Otwórz' }}
        <span class="grid size-5 place-items-center rounded-full text-abyss-950 cosmo-bar">
          <AppIcon name="plus" class="text-[0.7rem]" />
        </span>
      </span>
    </footer>
  </article>
</template>
