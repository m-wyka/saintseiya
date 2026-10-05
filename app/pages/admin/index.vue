<script setup lang="ts">
import { userRoleLabelKey } from '#shared/utils/roles';

definePageMeta({ layout: 'admin' });

const { t } = useI18n();

const { data: statistics } = await useFetch('/api/admin/dashboard');

const yearlySeries = (key: 'posts' | 'comments' | 'news') =>
  statistics.value?.yearlyActivity.map((entry) => ({ year: entry.year, value: entry[key] })) ?? [];

useSeoMeta({ title: () => t('ADMIN_NAV.DASHBOARD') });
</script>

<template>
  <div v-if="statistics">
    <AdminHeader :title="t('ADMIN_NAV.DASHBOARD')" :subtitle="t('ADMIN_DASHBOARD.SUBTITLE')" />

    <section
      class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5"
      :aria-label="t('ADMIN_DASHBOARD.KEY_FIGURES')"
    >
      <StatTile
        :label="t('ADMIN_NAV.USERS')"
        icon="user"
        :value="statistics.totals.members.total"
        :recent="statistics.totals.members.recent"
        :recent-period-days="statistics.recentPeriodDays"
      />
      <StatTile
        :label="t('ADMIN_DASHBOARD.GHOST_ACCOUNTS')"
        icon="user"
        :value="statistics.totals.members.ghosts"
        :note="t('ADMIN_DASHBOARD.GHOST_ACCOUNTS_NOTE')"
      />
      <StatTile
        :label="t('ADMIN_DASHBOARD.FORUM_POSTS')"
        icon="forum"
        :value="statistics.totals.posts.total"
        :recent="statistics.totals.posts.recent"
        :recent-period-days="statistics.recentPeriodDays"
      />
      <StatTile
        :label="t('ADMIN_DASHBOARD.THREADS')"
        icon="list"
        :value="statistics.totals.threads.total"
        :recent="statistics.totals.threads.recent"
        :recent-period-days="statistics.recentPeriodDays"
      />
      <StatTile
        :label="t('ADMIN_NAV.COMMENTS')"
        icon="comment"
        :value="statistics.totals.comments.total"
        :recent="statistics.totals.comments.recent"
        :recent-period-days="statistics.recentPeriodDays"
      />
      <StatTile
        :label="t('ADMIN_NAV.NEWS')"
        icon="star"
        :value="statistics.totals.news.total"
        :recent="statistics.totals.news.recent"
        :recent-period-days="statistics.recentPeriodDays"
      />
      <StatTile :label="t('ADMIN_NAV.PAGES')" icon="list" :value="statistics.totals.pages.total" />
      <StatTile
        :label="t('ADMIN_DASHBOARD.GALLERY_PHOTOS')"
        icon="image"
        :value="statistics.totals.photos.total"
        :recent="statistics.totals.photos.recent"
        :recent-period-days="statistics.recentPeriodDays"
      />
      <StatTile
        :label="t('ADMIN_NAV.VIDEOS')"
        icon="play"
        :value="statistics.totals.videos.total"
        :recent="statistics.totals.videos.recent"
        :recent-period-days="statistics.recentPeriodDays"
      />
      <StatTile
        :label="t('ADMIN_DASHBOARD.SHOUTS')"
        icon="send"
        :value="statistics.totals.shouts.total"
        :recent="statistics.totals.shouts.recent"
        :recent-period-days="statistics.recentPeriodDays"
      />
    </section>

    <section class="mt-8" aria-labelledby="activity-heading">
      <h2 id="activity-heading" class="mb-3 heading-display text-xl text-gold-300">
        {{ t('ADMIN_DASHBOARD.YEARLY_ACTIVITY') }}
      </h2>
      <div class="grid gap-4 xl:grid-cols-3">
        <YearlyColumnChart
          :title="t('ADMIN_DASHBOARD.FORUM_POSTS')"
          unit-key="ADMIN_DASHBOARD.POST_COUNT"
          :points="yearlySeries('posts')"
        />
        <YearlyColumnChart
          :title="t('ADMIN_NAV.COMMENTS')"
          unit-key="ADMIN_DASHBOARD.COMMENT_COUNT"
          :points="yearlySeries('comments')"
        />
        <YearlyColumnChart
          :title="t('ADMIN_NAV.NEWS')"
          unit-key="ADMIN_DASHBOARD.NEWS_COUNT"
          :points="yearlySeries('news')"
        />
      </div>
    </section>

    <div class="mt-8 grid gap-6 xl:grid-cols-3">
      <section class="panel p-4">
        <h2 class="mb-3 heading-display text-lg text-gold-300">{{ t('ADMIN_DASHBOARD.LATEST_MEMBERS') }}</h2>
        <ul v-if="statistics.latestMembers.length" class="divide-y divide-aqua-500/10 text-sm">
          <li
            v-for="member in statistics.latestMembers"
            :key="member.id"
            class="flex items-center justify-between gap-3 py-2"
          >
            <span class="min-w-0 truncate text-aqua-200">{{ member.name }}</span>
            <span class="shrink-0 text-xs text-aqua-500"
              >{{ t(userRoleLabelKey(member.role)) }} · {{ formatLongDate(member.createdAt) }}</span
            >
          </li>
        </ul>
        <p v-else class="text-sm text-aqua-500">{{ t('ADMIN_DASHBOARD.NO_MEMBERS') }}</p>
      </section>

      <section class="panel p-4">
        <h2 class="mb-3 heading-display text-lg text-gold-300">{{ t('ADMIN_DASHBOARD.TOP_FORUM_AUTHORS') }}</h2>
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
        <h2 class="mb-3 heading-display text-lg text-gold-300">{{ t('ADMIN_DASHBOARD.LATEST_COMMENTS') }}</h2>
        <ul class="divide-y divide-aqua-500/10 text-sm">
          <li v-for="comment in statistics.latestComments" :key="comment.id" class="py-2">
            <NuxtLinkLocale :to="comment.target.url" class="block text-aqua-200 transition hover:text-gold-300">
              <span class="line-clamp-2">{{ comment.excerpt }}</span>
              <span class="text-xs text-aqua-500">{{ comment.author.name }} · {{ comment.target.title }}</span>
            </NuxtLinkLocale>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
