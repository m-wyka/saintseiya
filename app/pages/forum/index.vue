<script setup lang="ts">
import { routes } from '#shared/utils/routes';

const { t } = useI18n();
const { data: categories } = await useFetch('/api/forum');

useSeoMeta({ title: () => t('GENERAL.FORUM') });
</script>

<template>
  <div>
    <PageHeading :title="t('GENERAL.FORUM')" :subtitle="t('FORUM.SUBTITLE')" />
    <div class="flex flex-col gap-6">
      <section v-for="(category, categoryIndex) in categories" :key="category.id" class="reveal overflow-hidden panel">
        <PanelHeading :constellation-index="categoryIndex">{{ category.name }}</PanelHeading>
        <ul class="divide-y divide-aqua-500/10">
          <li
            v-for="forum in category.forums"
            :key="forum.id"
            class="group relative grid items-center gap-x-4 gap-y-1 px-4 py-3 transition duration-200 hover:bg-white/5 md:grid-cols-[minmax(0,1fr)_7rem_minmax(0,16rem)]"
          >
            <div class="flex min-w-0 items-start gap-3">
              <span
                class="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-black/40 text-cosmo-500 transition group-hover:cosmo-bar group-hover:text-abyss-950"
              >
                <AppIcon :name="forum.isStaffOnly ? 'lock' : 'forum'" />
              </span>
              <div class="min-w-0">
                <h3 class="font-semibold text-gold-300">
                  <NuxtLinkLocale :to="routes.forum(forum.slug)" class="after:absolute after:inset-0">{{
                    forum.name
                  }}</NuxtLinkLocale>
                </h3>
                <p class="text-xs text-aqua-300">{{ forum.description }}</p>
              </div>
            </div>
            <p class="text-xs text-aqua-500 max-md:pl-12">
              {{ t('FORUM.THREAD_COUNT', { count: formatNumber(forum.threadCount) }, forum.threadCount)
              }}<br class="max-md:hidden" />
              <span class="md:hidden"> · </span
              >{{ t('FORUM.POST_COUNT', { count: formatNumber(forum.postCount) }, forum.postCount) }}
            </p>
            <p v-if="forum.latestThread" class="min-w-0 text-xs text-aqua-500 max-md:pl-12">
              <NuxtLinkLocale
                :to="routes.thread(forum.latestThread.id)"
                class="relative z-10 block truncate text-aqua-200 hover:text-gold-300"
              >
                {{ forum.latestThread.title }}
              </NuxtLinkLocale>
              <span v-if="forum.latestThread.lastPostAt">{{ formatLongDate(forum.latestThread.lastPostAt) }}</span>
              <span v-if="forum.latestThread.authorName"> · {{ forum.latestThread.authorName }}</span>
            </p>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
