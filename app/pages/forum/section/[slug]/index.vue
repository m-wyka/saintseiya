<script setup lang="ts">
import { routes } from '#shared/utils/routes';

const route = useRoute('forum-section-slug');
const page = computed(() => Number(route.query.page) || 1);
const { data, error } = await useFetch(() => `/api/forum/forums/${route.params.slug}`, { query: { page } });

if (error.value || !data.value) {
  throw createError({
    statusCode: error.value?.statusCode ?? 404,
    statusMessage: 'Nie znaleziono działu',
    fatal: true,
  });
}

const { loggedIn } = useUserSession();

useSeoMeta({ title: () => `${data.value?.forum.name ?? ''} – Forum` });
</script>

<template>
  <div v-if="data">
    <BreadcrumbTrail :items="[{ title: 'Forum', to: routes.forumIndex() }]" />
    <PageHeading :title="data.forum.name" :subtitle="data.forum.description" />
    <div class="mb-4 flex justify-end">
      <BaseButton v-if="loggedIn" :to="`${routes.forum(data.forum.slug)}/nowy-temat`">
        <AppIcon name="plus" />
        Nowy temat
      </BaseButton>
      <LoginLink v-else label="Zaloguj się, aby założyć temat" />
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
                <NuxtLink :to="routes.thread(thread.id)" class="after:absolute after:inset-0">{{
                  thread.title
                }}</NuxtLink>
              </h2>
              <p class="text-xs text-aqua-500">
                <span v-if="thread.isSticky" class="mr-1 font-semibold text-gold-300">Przyklejony ·</span>
                <span v-if="thread.isLocked" class="mr-1 font-semibold text-aqua-300">Zamknięty ·</span>
                <AuthorName :author="thread.author" />
              </p>
            </div>
          </div>
          <p class="text-xs text-aqua-500 max-md:pl-11">
            {{ pluralize(thread.postCount, 'post', 'posty', 'postów') }}<br class="max-md:hidden" />
            <span class="md:hidden"> · </span>{{ pluralize(thread.viewCount, 'odsłona', 'odsłony', 'odsłon') }}
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
    <EmptyState v-else message="W tym dziale nie ma jeszcze żadnego tematu." />
    <PaginationNav :page="data.threads.page" :page-count="data.threads.pageCount" />
  </div>
</template>
