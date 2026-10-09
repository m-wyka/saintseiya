<script setup lang="ts">
import type { InternalApi } from 'nitropack';
import { routes } from '#shared/utils/routes';

type NewsSummary = InternalApi['/api/news']['get']['items'][number];

withDefaults(defineProps<{ news: NewsSummary; featured?: boolean; headingTag?: 'h2' | 'h3' }>(), {
  headingTag: 'h3',
});

const { t } = useI18n();
</script>

<template>
  <article
    class="group @container relative flex reveal flex-col overflow-hidden panel transition duration-300 ease-cosmo focus-within:border-cosmo-500/50 hover:border-cosmo-500/50 hover:shadow-aura"
  >
    <NewsSky :published-at="news.publishedAt" :category-image="news.category?.image" :featured="featured" />

    <div
      class="flex flex-1 flex-col gap-1.5 px-4 pt-3 pb-3.5"
      :class="{ '@md:flex-none @md:gap-2.5 @md:px-7 @md:py-6': featured }"
    >
      <NuxtLinkLocale
        v-if="news.category"
        :to="routes.newsCategory(news.category.slug)"
        class="relative z-10 max-w-full self-start truncate text-[0.7rem] font-semibold tracking-wide text-cosmo-400 uppercase transition hover:text-gold-300"
      >
        {{ news.category.name }}
      </NuxtLinkLocale>
      <component
        :is="headingTag"
        class="line-clamp-3 heading-display text-lg/snug text-gold-300"
        :class="{ '@md:text-2xl/tight': featured }"
      >
        <NuxtLinkLocale
          :to="routes.news(news.slug)"
          class="transition duration-300 group-hover:text-gold-100 after:absolute after:inset-0"
        >
          {{ news.title }}
        </NuxtLinkLocale>
      </component>
      <p
        v-if="news.teaser"
        class="line-clamp-2 text-sm/6 wrap-anywhere text-mist/80"
        :class="{ '@md:line-clamp-3 @md:text-[0.95rem]/7': featured }"
      >
        {{ news.teaser }}
      </p>
      <footer class="mt-auto flex items-center justify-between gap-3 pt-2 text-xs text-aqua-300">
        <span class="flex min-w-0 items-center gap-1.5">
          <AppIcon name="user" class="text-cosmo-500" />
          <AuthorName :author="news.author" />
        </span>
        <span class="flex shrink-0 items-center gap-1.5">
          <AppIcon name="comment" class="text-cosmo-500" />
          <span aria-hidden="true">{{ formatNumber(news.commentCount) }}</span>
          <span class="sr-only">
            {{ t('NEWS_LIST.COMMENT_COUNT', { count: formatNumber(news.commentCount) }, news.commentCount) }}
          </span>
        </span>
      </footer>
    </div>
  </article>
</template>
