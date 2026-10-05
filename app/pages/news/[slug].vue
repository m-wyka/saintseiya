<script setup lang="ts">
import { routes } from '#shared/utils/routes';

const route = useRoute('news-slug');
const { data: news, error } = await useFetch(() => `/api/news/${route.params.slug}`);

if (error.value || !news.value) {
  throw createError({ statusCode: error.value?.statusCode ?? 404, statusMessage: 'Nie znaleziono newsa', fatal: true });
}

useSeoMeta({ title: () => news.value?.title ?? '', ogType: 'article' });
</script>

<template>
  <article v-if="news">
    <BreadcrumbTrail
      :items="[
        { title: 'Newsy', to: routes.newsList() },
        ...(news.category ? [{ title: news.category.name, to: routes.newsCategory(news.category.slug) }] : []),
      ]"
    />
    <PageHeading :title="news.title" />
    <p class="mb-6 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-aqua-300">
      <span class="flex items-center gap-1.5">
        <AppIcon name="user" class="text-cosmo-500" />
        <AuthorName :author="news.author" />
      </span>
      <time v-if="news.publishedAt" :datetime="news.publishedAt" class="flex items-center gap-1.5">
        <AppIcon name="calendar" class="text-cosmo-500" />
        {{ formatLongDate(news.publishedAt) }}
      </time>
      <span class="flex items-center gap-1.5">
        <AppIcon name="eye" class="text-cosmo-500" />
        {{ pluralize(news.viewCount, 'odsłona', 'odsłony', 'odsłon') }}
      </span>
    </p>
    <div class="panel p-6 sm:p-8">
      <img
        v-if="news.category?.image"
        :src="routes.media(news.category.image)"
        :alt="news.category.name"
        width="150"
        height="200"
        class="float-right mb-4 ml-6 h-40 w-30 rounded-lg border border-gold-300/40 object-cover shadow-panel max-sm:hidden"
      />
      <RichContent :html="news.excerptHtml" />
      <RichContent v-if="news.bodyHtml" :html="news.bodyHtml" class="mt-4" />
    </div>
    <ul v-if="news.tags.length" class="mt-4 flex flex-wrap gap-2">
      <li v-for="tag in news.tags" :key="tag.slug">
        <NuxtLink
          :to="routes.tag(tag.slug)"
          class="flex items-center gap-1 rounded-full border border-aqua-500/30 px-3 py-1 text-xs text-aqua-200 transition hover:border-cosmo-500 hover:text-gold-300"
        >
          <AppIcon name="tag" class="text-cosmo-500" />
          {{ tag.name }}
        </NuxtLink>
      </li>
    </ul>
    <CommentSection target-kind="news" :target-id="news.id" :enabled="news.commentsEnabled" />
  </article>
</template>
