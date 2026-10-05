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

const route = useRoute('admin-ankiety-id');
const { input, isNew, isBusy, errorMessage, save } = await useAdminForm<PollInput>({
  resource: 'polls',
  recordId: route.params.id,
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
  option.voteCount === undefined ? undefined : pluralize(option.voteCount, 'głos', 'głosy', 'głosów');

useSeoMeta({ title: isNew ? 'Nowa ankieta' : 'Edycja ankiety' });
</script>

<template>
  <form @submit.prevent="save">
    <AdminHeader :title="isNew ? 'Nowa ankieta' : 'Edycja ankiety'" />
    <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div class="flex flex-col gap-5 panel p-5">
        <BaseInput v-model="input.question" label="Pytanie" :maxlength="300" required />
        <fieldset class="flex flex-col gap-3">
          <legend class="mb-2 text-xs font-semibold tracking-wide text-aqua-300 uppercase">
            Odpowiedzi (od {{ MIN_POLL_OPTIONS }} do {{ MAX_POLL_OPTIONS }})
          </legend>
          <ol class="flex flex-col gap-2">
            <li v-for="(option, index) in input.options" :key="index" class="flex items-start gap-2">
              <span class="w-6 shrink-0 pt-2 text-right text-xs text-aqua-500 tabular-nums" aria-hidden="true">
                {{ index + 1 }}.
              </span>
              <BaseInput
                v-model="option.label"
                class="min-w-0 flex-1"
                :label="`Odpowiedź ${index + 1}`"
                :hint="votesHintOf(option)"
                :maxlength="200"
                hide-label
                required
              />
              <MoveButtons
                :item-label="`odpowiedź ${index + 1}`"
                :is-first="index === 0"
                :is-last="index === input.options.length - 1"
                @move="moveOption(index, $event)"
              />
              <BaseButton
                variant="ghost"
                size="sm"
                :disabled="!canRemoveOption"
                :aria-label="`Usuń odpowiedź ${index + 1}`"
                @click="removeOption(index)"
              >
                <AppIcon name="trash" />
              </BaseButton>
            </li>
          </ol>
          <BaseButton variant="secondary" size="sm" class="self-start" :disabled="!canAddOption" @click="addOption">
            <AppIcon name="plus" />
            Dodaj odpowiedź
          </BaseButton>
          <p v-if="!isNew" class="text-xs text-aqua-500">
            Zmiana treści lub kolejności odpowiedzi zachowuje oddane głosy. Usunięcie odpowiedzi kasuje także jej głosy.
          </p>
        </fieldset>
      </div>

      <aside class="flex flex-col gap-5 self-start panel p-5">
        <BaseCheckbox
          v-model="input.isClosed"
          label="Ankieta zakończona"
          hint="Zakończona ankieta pokazuje wyniki, ale nie przyjmuje głosów."
        />
        <FormActions :cancel-to="LIST_PATH" :is-busy="isBusy" :error-message="errorMessage" />
      </aside>
    </div>
  </form>
</template>
