<script setup lang="ts">
import { routes } from '#shared/utils/routes';

const { t } = useI18n();
const routeSlug = useRouteParam('slug');
const page = usePageQuery();
const redirectPastLastPage = useLastPageRedirect();
const { data, error } = await useFetch(() => `/api/forum/forums/${routeSlug.value}`, { query: { page } });

if (error.value || !data.value) {
  throw createError({
    statusCode: error.value?.statusCode ?? 404,
    statusMessage: t('FORUM.SECTION_NOT_FOUND'),
    fatal: true,
  });
}

await redirectPastLastPage(data.value.threads);

const { loggedIn } = useUserSession();

useSeoMeta({ title: () => `${data.value?.forum.name ?? ''} – ${t('GENERAL.FORUM')}` });
</script>

<template>
  <div v-if="data">
    <BreadcrumbTrail :items="[{ title: t('GENERAL.FORUM'), to: routes.forumIndex() }]" />
    <PageHeading :title="data.forum.name" :subtitle="data.forum.description" />
    <div class="mb-4 flex justify-end">
      <BaseButton v-if="loggedIn" :to="`${routes.forum(data.forum.slug)}/nowy-temat`">
        <AppIcon name="plus" />
        {{ t('FORUM.NEW_THREAD') }}
      </BaseButton>
      <LoginLink v-else :label="t('FORUM.SIGN_IN_TO_CREATE_THREAD')" />
    </div>
    <div v-if="data.threads.items.length" class="overflow-hidden panel">
      <ul class="divide-y divide-aqua-500/10">
        <li
          v-for="thread in data.threads.items"
          :key="thread.id"
          class="group relative grid items-center gap-x-4 gap-y-1 px-4 py-3 transition duration-200 hover:bg-white/5 md:grid-cols-[minmax(0,1fr)_8rem_minmax(0,13rem)]"
        >
          <div class="flex min-w-0 items-start gap-3">
            <span
              class="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-black/40 transition"
              :class="thread.isSticky ? 'text-gold-300' : 'text-cosmo-500'"
            >
              <AppIcon :name="thread.isLocked ? 'lock' : thread.isSticky ? 'pin' : 'comment'" />
            </span>
            <div class="min-w-0">
              <h2 class="font-semibold text-aqua-200 transition group-hover:text-gold-300">
                <NuxtLinkLocale :to="routes.thread(thread.id)" class="after:absolute after:inset-0">{{
                  thread.title
                }}</NuxtLinkLocale>
              </h2>
              <p class="text-xs text-aqua-500">
                <span v-if="thread.isSticky" class="mr-1 font-semibold text-gold-300">{{ t('FORUM.STICKY') }} ·</span>
                <span v-if="thread.isLocked" class="mr-1 font-semibold text-aqua-300">{{ t('FORUM.LOCKED') }} ·</span>
                <AuthorName :author="thread.author" />
              </p>
            </div>
          </div>
          <p class="text-xs text-aqua-500 max-md:pl-11">
            {{ t('FORUM.POST_COUNT', { count: formatNumber(thread.postCount) }, thread.postCount)
            }}<br class="max-md:hidden" />
            <span class="md:hidden"> · </span
            >{{ t('FORUM.VIEW_COUNT', { count: formatNumber(thread.viewCount) }, thread.viewCount) }}
          </p>
          <p class="text-xs text-aqua-500 max-md:pl-11">
            <time :datetime="thread.lastPostAt">{{ formatDateTime(thread.lastPostAt) }}</time>
            <span v-if="thread.lastPostAuthor" class="block truncate text-aqua-300">{{
              thread.lastPostAuthor.name
            }}</span>
          </p>
        </li>
      </ul>
    </div>
    <EmptyState v-else :message="t('FORUM.SECTION_EMPTY')" />
    <PaginationNav :page="data.threads.page" :page-count="data.threads.pageCount" />
  </div>
</template>
