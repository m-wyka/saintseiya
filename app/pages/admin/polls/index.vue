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

const STATUS_FILTERS = [
  { value: '', label: 'Wszystkie' },
  { value: 'open', label: 'Trwające' },
  { value: 'closed', label: 'Zakończone' },
];
const COLUMNS = [
  { key: 'question', label: 'Pytanie' },
  { key: 'endedAt', label: 'Status' },
  { key: 'totalVotes', label: 'Głosów', alignsRight: true },
  { key: 'startedAt', label: 'Rozpoczęta' },
];

const { rows, page, pageCount, total, search, filter, isLoading, refresh, remove } = useAdminList<PollRow>('polls');
const toasts = useToastStore();

const isOpen = (poll: PollRow) => poll.endedAt === null;

const setClosed = async (poll: PollRow, isClosed: boolean) => {
  try {
    const { question, options } = await $fetch<StoredPoll>(`/api/admin/polls/${poll.id}`);
    await apiRequest(`/api/admin/polls/${poll.id}`, { method: 'PUT', body: { question, options, isClosed } });
    toasts.success(isClosed ? 'Ankieta zakończona' : 'Ankieta wznowiona');
    await refresh();
  } catch (error) {
    toasts.error(apiErrorMessage(error));
  }
};

useSeoMeta({ title: 'Ankiety' });
</script>

<template>
  <div>
    <AdminHeader title="Ankiety" :subtitle="pluralize(total, 'ankieta', 'ankiety', 'ankiet')">
      <BaseInput
        v-model="search"
        type="search"
        label="Szukaj"
        placeholder="Szukaj w pytaniach…"
        hide-label
        class="w-56"
      />
      <BaseSelect v-model="filter" label="Status" :options="STATUS_FILTERS" hide-label class="w-40" />
      <BaseButton to="/admin/ankiety/nowy">
        <AppIcon name="plus" />
        Dodaj ankietę
      </BaseButton>
    </AdminHeader>

    <AdminTable :columns="COLUMNS" :rows="rows" :is-loading="isLoading" empty-message="Brak ankiet do wyświetlenia.">
      <template #cell-question="{ row }">
        <NuxtLink :to="`/admin/ankiety/${row.id}`" class="font-semibold text-gold-300 hover:text-cosmo-400">
          {{ row.question }}
        </NuxtLink>
      </template>
      <template #cell-endedAt="{ row }">
        <StateBadge v-if="isOpen(row)" label="Trwa" icon="play" tone="positive" />
        <StateBadge v-else label="Zakończona" icon="lock" tone="muted" />
      </template>
      <template #cell-totalVotes="{ row }">{{ formatNumber(row.totalVotes) }}</template>
      <template #cell-startedAt="{ row }">
        <time :datetime="row.startedAt" class="whitespace-nowrap">{{ formatLongDate(row.startedAt) }}</time>
      </template>
      <template #actions="{ row }">
        <BaseButton variant="ghost" size="sm" @click="setClosed(row, isOpen(row))">
          <AppIcon :name="isOpen(row) ? 'lock' : 'play'" />
          {{ isOpen(row) ? 'Zakończ' : 'Wznów' }}
        </BaseButton>
        <BaseButton :to="`/admin/ankiety/${row.id}`" variant="ghost" size="sm">
          <AppIcon name="edit" />
          Edytuj
        </BaseButton>
        <ConfirmButton @confirm="remove(row.id)" />
      </template>
    </AdminTable>
    <PageStepper v-model="page" :page-count="pageCount" />
  </div>
</template>
