<script setup lang="ts">
definePageMeta({ layout: 'admin' });

interface PollRow {
  id: number;
  question: string;
  startedAt: string;
  endedAt: string | null;
  totalVotes: number;
}

interface StoredPoll {
  question: string;
  options: { id: number; label: string }[];
}

const { t } = useI18n();

const statusFilters = computed(() => [
  { value: '', label: t('GENERAL.ALL') },
  { value: 'open', label: t('ADMIN_POLLS.FILTER_OPEN') },
  { value: 'closed', label: t('ADMIN_POLLS.FILTER_CLOSED') },
]);
const columns = computed(() => [
  { key: 'question', label: t('ADMIN_POLLS.QUESTION') },
  { key: 'endedAt', label: t('GENERAL.STATUS') },
  { key: 'totalVotes', label: t('ADMIN_POLLS.VOTES_COLUMN'), alignsRight: true },
  { key: 'startedAt', label: t('ADMIN_POLLS.STARTED') },
]);

const { rows, page, pageCount, total, search, filter, isLoading, refresh, remove } = useAdminList<PollRow>('polls');
const toasts = useToastStore();

const isOpen = (poll: PollRow) => poll.endedAt === null;

const setClosed = async (poll: PollRow, isClosed: boolean) => {
  try {
    const { question, options } = await $fetch<StoredPoll>(`/api/admin/polls/${poll.id}`);
    await apiRequest(`/api/admin/polls/${poll.id}`, { method: 'PUT', body: { question, options, isClosed } });
    toasts.success(t(isClosed ? 'ADMIN_POLLS.POLL_CLOSED' : 'ADMIN_POLLS.POLL_REOPENED'));
    await refresh();
  } catch (error) {
    toasts.error(apiErrorMessage(error));
  }
};

useSeoMeta({ title: () => t('ADMIN_NAV.POLLS') });
</script>

<template>
  <div>
    <AdminHeader
      :title="t('ADMIN_NAV.POLLS')"
      :subtitle="t('ADMIN_POLLS.POLL_COUNT', { count: formatNumber(total) }, total)"
    >
      <BaseInput
        v-model="search"
        type="search"
        :label="t('GENERAL.SEARCH')"
        :placeholder="t('ADMIN_POLLS.SEARCH_PLACEHOLDER')"
        hide-label
        class="w-56"
      />
      <BaseSelect v-model="filter" :label="t('GENERAL.STATUS')" :options="statusFilters" hide-label class="w-40" />
      <BaseButton to="/admin/ankiety/nowy">
        <AppIcon name="plus" />
        {{ t('ADMIN_POLLS.ADD_POLL') }}
      </BaseButton>
    </AdminHeader>

    <AdminTable :columns="columns" :rows="rows" :is-loading="isLoading" :empty-message="t('ADMIN_POLLS.EMPTY')">
      <template #cell-question="{ row }">
        <NuxtLinkLocale :to="`/admin/ankiety/${row.id}`" class="font-semibold text-gold-300 hover:text-cosmo-400">
          {{ row.question }}
        </NuxtLinkLocale>
      </template>
      <template #cell-endedAt="{ row }">
        <StateBadge v-if="isOpen(row)" :label="t('ADMIN_POLLS.BADGE_OPEN')" icon="play" tone="positive" />
        <StateBadge v-else :label="t('ADMIN_POLLS.BADGE_CLOSED')" icon="lock" tone="muted" />
      </template>
      <template #cell-totalVotes="{ row }">{{ formatNumber(row.totalVotes) }}</template>
      <template #cell-startedAt="{ row }">
        <time :datetime="row.startedAt" class="whitespace-nowrap">{{ formatLongDate(row.startedAt) }}</time>
      </template>
      <template #actions="{ row }">
        <BaseButton variant="ghost" size="sm" @click="setClosed(row, isOpen(row))">
          <AppIcon :name="isOpen(row) ? 'lock' : 'play'" />
          {{ isOpen(row) ? t('ADMIN_POLLS.CLOSE') : t('ADMIN_POLLS.REOPEN') }}
        </BaseButton>
        <BaseButton :to="`/admin/ankiety/${row.id}`" variant="ghost" size="sm">
          <AppIcon name="edit" />
          {{ t('GENERAL.EDIT') }}
        </BaseButton>
        <ConfirmButton :question="t('CONFIRM.DELETE_POLL')" @confirm="remove(row.id)" />
      </template>
    </AdminTable>
    <PageStepper v-model="page" :page-count="pageCount" />
  </div>
</template>
