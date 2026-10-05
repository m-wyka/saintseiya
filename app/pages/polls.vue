<script setup lang="ts">
const { t } = useI18n();
const route = useRoute();
const page = computed(() => Number(route.query.page) || 1);
const { data: polls, refresh } = await useFetch('/api/polls', { query: { page } });

useSeoMeta({ title: () => t('POLLS.TITLE') });
</script>

<template>
  <div>
    <PageHeading :title="t('POLLS.TITLE')" :subtitle="t('POLLS.SUBTITLE')" />
    <div v-if="polls?.items.length" class="grid gap-5 lg:grid-cols-2">
      <PollCard v-for="poll in polls.items" :key="poll.id" :poll="poll" @voted="refresh()" />
    </div>
    <EmptyState v-else :message="t('POLLS.EMPTY')" />
    <PaginationNav v-if="polls" :page="polls.page" :page-count="polls.pageCount" />
  </div>
</template>
