<script setup lang="ts">
import { routes } from '#shared/utils/routes';

const { t } = useI18n();
const pagePath = useRouteParam('path');
const { data: page, error } = await useFetch(() => `/api/pages/${pagePath.value}`);

if (error.value || !page.value) {
  throw createError({
    statusCode: error.value?.statusCode ?? 404,
    statusMessage: t('PAGE.NOT_FOUND'),
    fatal: true,
  });
}

const breadcrumbs = computed(
  () => page.value?.breadcrumbs.map(({ title, path }) => ({ title, to: routes.page(path) })) ?? [],
);
const seoTitle = computed(() =>
  [page.value?.title, ...breadcrumbs.value.map((crumb) => crumb.title).reverse()].join(' – '),
);
const showsChildren = computed(
  () => Boolean(page.value?.children.length) && (page.value?.kind === 'hub' || !page.value?.bodyHtml),
);

useSeoMeta({ title: seoTitle });
</script>

<template>
  <article v-if="page">
    <BreadcrumbTrail :items="breadcrumbs" />
    <PageHeading :title="page.title" />
    <div v-if="page.bodyHtml" class="panel p-6 sm:p-8">
      <RichContent :html="page.bodyHtml" />
    </div>
    <ul v-if="showsChildren" class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" :class="{ 'mt-6': page.bodyHtml }">
      <li v-for="child in page.children" :key="child.path" class="reveal">
        <NuxtLinkLocale
          :to="routes.page(child.path)"
          class="group flex h-full items-center gap-3 panel px-4 py-3 text-sm transition duration-300 ease-cosmo hover:-translate-y-0.5 hover:border-cosmo-500/60 hover:shadow-aura"
        >
          <span
            class="grid size-8 shrink-0 place-items-center rounded-full bg-black/40 text-cosmo-500 transition group-hover:cosmo-bar group-hover:text-abyss-950"
          >
            <AppIcon :name="child.childCount ? 'folder' : 'chevronRight'" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block font-semibold text-aqua-200 transition group-hover:text-gold-300">{{
              child.title
            }}</span>
            <span v-if="child.childCount" class="block text-xs text-aqua-500">
              {{ t('PAGE.CHILD_COUNT', { count: formatNumber(child.childCount) }, child.childCount) }}
            </span>
          </span>
        </NuxtLinkLocale>
      </li>
    </ul>
    <CommentSection
      v-if="page.kind === 'article'"
      target-kind="page"
      :target-id="page.id"
      :enabled="page.commentsEnabled"
    />
  </article>
</template>
