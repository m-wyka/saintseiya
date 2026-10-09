<script setup lang="ts">
import { routes } from '#shared/utils/routes';

const { t } = useI18n();
const routeSlug = useRouteParam('slug');
const { data: news, error } = await useFetch(() => `/api/news/${routeSlug.value}`);

if (error.value || !news.value) {
  throw createError({ statusCode: error.value?.statusCode ?? 404, statusMessage: t('NEWS.NOT_FOUND'), fatal: true });
}

useSeoMeta({ title: () => news.value?.title ?? '', ogType: 'article' });
</script>

<template>
  <article v-if="news">
    <BreadcrumbTrail
      :items="[
        { title: t('GENERAL.NEWS'), to: routes.newsList() },
        ...(news.category ? [{ title: news.category.name, to: routes.newsCategory(news.category.slug) }] : []),
      ]"
    />
    <PageHeading :title="news.title" />
    <p class="mb-6 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-aqua-300">
      <span class="flex items-center gap-1.5">
        <AppIcon name="user" class="text-cosmo-500" />
        <AuthorName :author="news.author" />
      </span>
      <span class="flex items-center gap-1.5">
        <AppIcon name="eye" class="text-cosmo-500" />
        {{ t('NEWS.VIEW_COUNT', { count: formatNumber(news.viewCount) }, news.viewCount) }}
      </span>
    </p>
    <div class="overflow-hidden panel">
      <div class="group @container">
        <NewsSky :published-at="news.publishedAt" :category-image="news.category?.image" featured />
      </div>
      <div class="p-6 sm:p-8">
        <RichContent v-if="news.excerptHtml" :html="news.excerptHtml" />
        <RichContent v-if="news.bodyHtml" :html="news.bodyHtml" :class="{ 'mt-4': news.excerptHtml }" />
      </div>
    </div>
    <ul v-if="news.tags.length" class="mt-4 flex flex-wrap gap-2">
      <li v-for="tag in news.tags" :key="tag.slug">
        <NuxtLinkLocale
          :to="routes.tag(tag.slug)"
          class="flex items-center gap-1 rounded-full border border-aqua-500/30 px-3 py-1 text-xs text-aqua-200 transition hover:border-cosmo-500 hover:text-gold-300"
        >
          <AppIcon name="tag" class="text-cosmo-500" />
          {{ tag.name }}
        </NuxtLinkLocale>
      </li>
    </ul>
    <CommentSection target-kind="news" :target-id="news.id" :enabled="news.commentsEnabled" />
  </article>
</template>
