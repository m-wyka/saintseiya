<script setup lang="ts">
import { USER_ROLE_LABELS } from '#shared/utils/roles';

definePageMeta({ layout: 'admin' });

const { data: statistics } = await useFetch('/api/admin/dashboard');

const yearlySeries = (key: 'posts' | 'comments' | 'news') =>
  statistics.value?.yearlyActivity.map((entry) => ({ year: entry.year, value: entry[key] })) ?? [];

useSeoMeta({ title: 'Dashboard' });
</script>

<template>
  <div v-if="statistics">
    <AdminHeader title="Dashboard" subtitle="Stan portalu w liczbach." />

    <section class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5" aria-label="Najważniejsze liczby">
      <StatTile
        label="Użytkownicy"
        icon="user"
        :value="statistics.totals.members.total"
        :recent="statistics.totals.members.recent"
        :recent-period-days="statistics.recentPeriodDays"
      />
      <StatTile
        label="Konta usunięte (archiwalne)"
        icon="user"
        :value="statistics.totals.members.ghosts"
        note="Autorzy starych treści"
      />
      <StatTile
        label="Posty na forum"
        icon="forum"
        :value="statistics.totals.posts.total"
        :recent="statistics.totals.posts.recent"
        :recent-period-days="statistics.recentPeriodDays"
      />
      <StatTile
        label="Tematy"
        icon="list"
        :value="statistics.totals.threads.total"
        :recent="statistics.totals.threads.recent"
        :recent-period-days="statistics.recentPeriodDays"
      />
      <StatTile
        label="Komentarze"
        icon="comment"
        :value="statistics.totals.comments.total"
        :recent="statistics.totals.comments.recent"
        :recent-period-days="statistics.recentPeriodDays"
      />
      <StatTile
        label="Newsy"
        icon="star"
        :value="statistics.totals.news.total"
        :recent="statistics.totals.news.recent"
        :recent-period-days="statistics.recentPeriodDays"
      />
      <StatTile label="Podstrony" icon="list" :value="statistics.totals.pages.total" />
      <StatTile
        label="Grafiki w galerii"
        icon="image"
        :value="statistics.totals.photos.total"
        :recent="statistics.totals.photos.recent"
        :recent-period-days="statistics.recentPeriodDays"
      />
      <StatTile
        label="Filmy"
        icon="play"
        :value="statistics.totals.videos.total"
        :recent="statistics.totals.videos.recent"
        :recent-period-days="statistics.recentPeriodDays"
      />
      <StatTile
        label="Wpisy w shoutboxie"
        icon="send"
        :value="statistics.totals.shouts.total"
        :recent="statistics.totals.shouts.recent"
        :recent-period-days="statistics.recentPeriodDays"
      />
    </section>

    <section class="mt-8" aria-labelledby="activity-heading">
      <h2 id="activity-heading" class="mb-3 heading-display text-xl text-gold-300">Aktywność rok po roku</h2>
      <div class="grid gap-4 xl:grid-cols-3">
        <YearlyColumnChart title="Posty na forum" :unit="['post', 'posty', 'postów']" :points="yearlySeries('posts')" />
        <YearlyColumnChart
          title="Komentarze"
          :unit="['komentarz', 'komentarze', 'komentarzy']"
          :points="yearlySeries('comments')"
        />
        <YearlyColumnChart title="Newsy" :unit="['news', 'newsy', 'newsów']" :points="yearlySeries('news')" />
      </div>
    </section>

    <div class="mt-8 grid gap-6 xl:grid-cols-3">
      <section class="panel p-4">
        <h2 class="mb-3 heading-display text-lg text-gold-300">Najnowsi użytkownicy</h2>
        <ul v-if="statistics.latestMembers.length" class="divide-y divide-aqua-500/10 text-sm">
          <li
            v-for="member in statistics.latestMembers"
            :key="member.id"
            class="flex items-center justify-between gap-3 py-2"
          >
            <span class="min-w-0 truncate text-aqua-200">{{ member.name }}</span>
            <span class="shrink-0 text-xs text-aqua-500"
              >{{ USER_ROLE_LABELS[member.role] }} · {{ formatLongDate(member.createdAt) }}</span
            >
          </li>
        </ul>
        <p v-else class="text-sm text-aqua-500">Nikt się jeszcze nie zarejestrował.</p>
      </section>

      <section class="panel p-4">
        <h2 class="mb-3 heading-display text-lg text-gold-300">Najaktywniejsi na forum</h2>
        <ol class="divide-y divide-aqua-500/10 text-sm">
          <li
            v-for="author in statistics.topForumAuthors"
            :key="author.id"
            class="flex items-center justify-between gap-3 py-2"
          >
            <AuthorName :author="author" class="min-w-0" />
            <span class="shrink-0 text-xs text-aqua-500 tabular-nums">{{ formatNumber(author.postCount) }}</span>
          </li>
        </ol>
      </section>

      <section class="panel p-4">
        <h2 class="mb-3 heading-display text-lg text-gold-300">Ostatnie komentarze</h2>
        <ul class="divide-y divide-aqua-500/10 text-sm">
          <li v-for="comment in statistics.latestComments" :key="comment.id" class="py-2">
            <NuxtLink :to="comment.target.url" class="block text-aqua-200 transition hover:text-gold-300">
              <span class="line-clamp-2">{{ comment.excerpt }}</span>
              <span class="text-xs text-aqua-500">{{ comment.author.name }} · {{ comment.target.title }}</span>
            </NuxtLink>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
