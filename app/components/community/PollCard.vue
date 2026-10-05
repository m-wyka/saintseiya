<script setup lang="ts">
import type { InternalApi } from 'nitropack';

type Poll = InternalApi['/api/polls']['get']['items'][number];

const props = defineProps<{ poll: Poll }>();
const emit = defineEmits<{ voted: [] }>();

const PERCENT = 100;

const { loggedIn } = useUserSession();
const { isBusy, errorMessage, run } = useApiAction();

const totalVotes = computed(() => props.poll.options.reduce((total, option) => total + option.voteCount, 0));
const leadingVoteCount = computed(() => Math.max(0, ...props.poll.options.map((option) => option.voteCount)));
const canVote = computed(() => props.poll.isOpen && loggedIn.value && props.poll.votedOptionId === null);

const shareOf = (voteCount: number) => (totalVotes.value ? Math.round((voteCount / totalVotes.value) * PERCENT) : 0);

const vote = async (optionId: number) => {
  const voted = await run(() => apiRequest(`/api/polls/${props.poll.id}/vote`, { method: 'POST', body: { optionId } }));
  if (voted) {
    emit('voted');
  }
};
</script>

<template>
  <article class="reveal panel p-5">
    <header class="mb-4 flex flex-wrap items-start justify-between gap-2">
      <h2 class="min-w-0 flex-1 heading-display text-lg text-gold-300">{{ poll.question }}</h2>
      <span
        class="rounded-full border px-2.5 py-0.5 text-[0.7rem] font-semibold tracking-wide uppercase"
        :class="poll.isOpen ? 'border-cosmo-500/60 text-cosmo-400' : 'border-aqua-500/30 text-aqua-500'"
      >
        {{ poll.isOpen ? 'Trwa' : 'Zakończona' }}
      </span>
    </header>
    <ul class="flex flex-col gap-2.5">
      <li v-for="option in poll.options" :key="option.id">
        <p class="mb-1 flex items-baseline justify-between gap-3 text-sm">
          <span
            :class="
              option.voteCount === leadingVoteCount && totalVotes ? 'font-semibold text-gold-300' : 'text-aqua-200'
            "
          >
            {{ option.label }}
            <AppIcon v-if="poll.votedOptionId === option.id" name="check" class="text-cosmo-500" />
          </span>
          <span class="shrink-0 text-xs text-aqua-500"
            >{{ shareOf(option.voteCount) }}% · {{ formatNumber(option.voteCount) }}</span
          >
        </p>
        <div class="flex items-center gap-2">
          <div class="h-2 flex-1 overflow-hidden rounded-full bg-black/50" role="presentation">
            <div
              class="h-full rounded-full cosmo-bar transition-[width] duration-700 ease-cosmo"
              :style="{ width: `${shareOf(option.voteCount)}%` }"
            />
          </div>
          <BaseButton v-if="canVote" variant="secondary" size="sm" :busy="isBusy" @click="vote(option.id)"
            >Głosuję</BaseButton
          >
        </div>
      </li>
    </ul>
    <p v-if="errorMessage" class="mt-3 text-sm text-danger" role="alert">{{ errorMessage }}</p>
    <footer class="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-aqua-500">
      <span>{{ pluralize(totalVotes, 'głos', 'głosy', 'głosów') }}</span>
      <time :datetime="poll.startedAt">{{ formatLongDate(poll.startedAt) }}</time>
    </footer>
  </article>
</template>
