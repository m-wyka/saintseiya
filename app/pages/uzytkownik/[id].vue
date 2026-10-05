<script setup lang="ts">
import { GHOST_USER_CAPTION } from '#shared/utils/content';
import { USER_ROLE_LABELS } from '#shared/utils/roles';
import { routes } from '#shared/utils/routes';

const route = useRoute('uzytkownik-id');
const { data: profile, error } = await useFetch(() => `/api/users/${route.params.id}`);

if (error.value || !profile.value) {
  throw createError({
    statusCode: error.value?.statusCode ?? 404,
    statusMessage: 'Nie znaleziono użytkownika',
    fatal: true,
  });
}

const initial = computed(() => profile.value?.name.trim().charAt(0).toLocaleUpperCase('pl') ?? '');

useSeoMeta({ title: () => profile.value?.name ?? '', robots: 'noindex' });
</script>

<template>
  <div v-if="profile">
    <header class="mb-6 flex animate-rise flex-wrap items-center gap-5 panel p-6">
      <img
        v-if="profile.avatarUrl"
        :src="profile.avatarUrl"
        alt=""
        class="size-20 rounded-full border border-gold-300/50"
        referrerpolicy="no-referrer"
      />
      <span
        v-else
        class="grid size-20 place-items-center rounded-full border font-display text-3xl font-bold"
        :class="profile.isGhost ? 'border-aqua-500/30 text-aqua-500' : 'border-gold-300/50 text-gold-300'"
        aria-hidden="true"
      >
        {{ initial }}
      </span>
      <div class="min-w-0 flex-1">
        <h1 class="heading-display text-3xl" :class="profile.isGhost ? 'text-aqua-300' : 'text-gold-300'">
          {{ profile.name }}
        </h1>
        <p class="text-sm text-aqua-500">
          <template v-if="profile.isGhost"
            >{{ GHOST_USER_CAPTION }} — archiwalny autor treści z dawnej wersji portalu.</template
          >
          <template v-else>
            {{ USER_ROLE_LABELS[profile.role] }}
            <template v-if="profile.createdAt"> · na portalu od {{ formatLongDate(profile.createdAt) }}</template>
          </template>
        </p>
      </div>
      <dl class="flex gap-6 text-center">
        <div>
          <dt class="text-xs text-aqua-500">Posty</dt>
          <dd class="text-2xl font-semibold text-mist">{{ formatNumber(profile.postCount) }}</dd>
        </div>
        <div>
          <dt class="text-xs text-aqua-500">Komentarze</dt>
          <dd class="text-2xl font-semibold text-mist">{{ formatNumber(profile.commentCount) }}</dd>
        </div>
      </dl>
    </header>

    <section v-if="profile.latestPosts.length">
      <SectionHeading title="Ostatnie posty na forum" />
      <ul class="flex flex-col gap-3">
        <li v-for="post in profile.latestPosts" :key="post.id">
          <a
            :href="routes.post(post.id)"
            class="block panel px-5 py-3 transition duration-300 ease-cosmo hover:-translate-y-0.5 hover:border-cosmo-500/60"
          >
            <span class="flex flex-wrap items-baseline justify-between gap-2">
              <span class="font-semibold text-gold-300">{{ post.threadTitle }}</span>
              <time :datetime="post.createdAt" class="text-xs text-aqua-500">{{ formatDateTime(post.createdAt) }}</time>
            </span>
            <span class="mt-1 block text-sm text-aqua-200">{{ post.excerpt }}</span>
          </a>
        </li>
      </ul>
    </section>
    <EmptyState v-else message="Ten użytkownik nie napisał jeszcze nic na forum." />
  </div>
</template>
