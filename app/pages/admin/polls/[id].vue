<script setup lang="ts">
import { withMovedItem } from '#shared/utils/ordering';
import type { MoveDirection } from '#shared/utils/ordering';
import { MAX_POLL_OPTIONS, MIN_POLL_OPTIONS } from '#shared/utils/pollLimits';

definePageMeta({ layout: 'admin' });

interface PollOptionInput {
  id: number | null;
  label: string;
  voteCount?: number;
}

interface PollInput extends Record<string, unknown> {
  question: string;
  options: PollOptionInput[];
  isClosed: boolean;
}

const LIST_PATH = '/admin/ankiety';

const emptyOption = (): PollOptionInput => ({ id: null, label: '' });

const { t } = useI18n();
const routeId = useRouteParam('id');
const { input, isNew, isBusy, errorMessage, save } = await useAdminForm<PollInput>({
  resource: 'polls',
  recordId: routeId.value,
  listPath: LIST_PATH,
  emptyInput: { question: '', options: [emptyOption(), emptyOption()], isClosed: false },
});

const canAddOption = computed(() => input.value.options.length < MAX_POLL_OPTIONS);
const canRemoveOption = computed(() => input.value.options.length > MIN_POLL_OPTIONS);

const addOption = () => {
  input.value.options = [...input.value.options, emptyOption()];
};

const removeOption = (index: number) => {
  input.value.options = input.value.options.filter((_option, position) => position !== index);
};

const moveOption = (index: number, direction: MoveDirection) => {
  input.value.options = withMovedItem(input.value.options, index, direction);
};

const votesHintOf = (option: PollOptionInput) =>
  option.voteCount === undefined
    ? undefined
    : t('ADMIN_POLLS.VOTE_COUNT', { count: formatNumber(option.voteCount) }, option.voteCount);

const pageTitle = computed(() => t(isNew ? 'ADMIN_POLLS.NEW_POLL' : 'ADMIN_POLLS.EDIT_POLL'));

useSeoMeta({ title: pageTitle });
</script>

<template>
  <form @submit.prevent="save">
    <AdminHeader :title="pageTitle" />
    <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div class="flex flex-col gap-5 panel p-5">
        <BaseInput v-model="input.question" :label="t('ADMIN_POLLS.QUESTION')" :maxlength="300" required />
        <fieldset class="flex flex-col gap-3">
          <legend class="mb-2 text-xs font-semibold tracking-wide text-aqua-300 uppercase">
            {{ t('ADMIN_POLLS.ANSWERS_LEGEND', { min: MIN_POLL_OPTIONS, max: MAX_POLL_OPTIONS }) }}
          </legend>
          <ol class="flex flex-col gap-2">
            <li v-for="(option, index) in input.options" :key="index" class="flex items-start gap-2">
              <span class="w-6 shrink-0 pt-2 text-right text-xs text-aqua-500 tabular-nums" aria-hidden="true">
                {{ index + 1 }}.
              </span>
              <BaseInput
                v-model="option.label"
                class="min-w-0 flex-1"
                :label="t('ADMIN_POLLS.ANSWER_LABEL', { number: index + 1 })"
                :hint="votesHintOf(option)"
                :maxlength="200"
                hide-label
                required
              />
              <MoveButtons
                :item-label="t('ADMIN_POLLS.ANSWER_ITEM', { number: index + 1 })"
                :is-first="index === 0"
                :is-last="index === input.options.length - 1"
                @move="moveOption(index, $event)"
              />
              <BaseButton
                variant="ghost"
                size="sm"
                :disabled="!canRemoveOption"
                :aria-label="t('ADMIN_POLLS.DELETE_ANSWER', { number: index + 1 })"
                @click="removeOption(index)"
              >
                <AppIcon name="trash" />
              </BaseButton>
            </li>
          </ol>
          <BaseButton variant="secondary" size="sm" class="self-start" :disabled="!canAddOption" @click="addOption">
            <AppIcon name="plus" />
            {{ t('ADMIN_POLLS.ADD_ANSWER') }}
          </BaseButton>
          <p v-if="!isNew" class="text-xs text-aqua-500">
            {{ t('ADMIN_POLLS.VOTES_KEPT_NOTE') }}
          </p>
        </fieldset>
      </div>

      <aside class="flex flex-col gap-5 self-start panel p-5">
        <BaseCheckbox
          v-model="input.isClosed"
          :label="t('ADMIN_POLLS.IS_CLOSED')"
          :hint="t('ADMIN_POLLS.IS_CLOSED_HINT')"
        />
        <FormActions :cancel-to="LIST_PATH" :is-busy="isBusy" :error-message="errorMessage" />
      </aside>
    </div>
  </form>
</template>
