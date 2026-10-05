<script setup lang="ts">
import type { InternalApi } from 'nitropack';
import { routes } from '#shared/utils/routes';

type ThreadSummary = InternalApi['/api/home']['get']['latestThreads'][number];

defineProps<{ title: string; threads: ThreadSummary[]; showsPostCount?: boolean }>();
</script>

<template>
  <section class="overflow-hidden panel">
    <h2 class="border-b border-aqua-500/15 bg-black/40 px-4 py-2 text-sm font-semibold tracking-wide text-gold-300">
      {{ title }}
    </h2>
    <ul class="divide-y divide-aqua-500/10">
      <li v-for="thread in threads" :key="thread.id">
        <NuxtLink
          :to="routes.thread(thread.id)"
          class="group flex items-center gap-3 px-4 py-2 text-sm transition duration-200 hover:bg-white/5"
        >
          <span class="min-w-0 flex-1">
            <span class="block truncate text-aqua-200 transition group-hover:text-gold-300">{{ thread.title }}</span>
            <span class="block truncate text-[0.7rem] text-aqua-500">
              {{ thread.forumName }}
              <template v-if="thread.lastPostAuthor"> · {{ thread.lastPostAuthor.name }}</template>
            </span>
          </span>
          <span
            v-if="showsPostCount"
            class="shrink-0 rounded-full cosmo-bar px-2 py-0.5 text-[0.7rem] font-bold text-abyss-950"
            :title="`${thread.postCount} postów`"
          >
            {{ formatNumber(thread.postCount) }}
          </span>
          <time v-else :datetime="thread.lastPostAt" class="shrink-0 text-[0.7rem] text-aqua-500">
            {{ formatLongDate(thread.lastPostAt) }}
          </time>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>
