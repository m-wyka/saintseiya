<script setup lang="ts" generic="Row extends { id: number }">
import type { CrudColumn, CrudField } from '~/utils/crud';
import type { IconName } from '~/utils/icons';

const props = defineProps<{
  resource: string;
  title: string;
  subtitle?: string;
  addLabel: string;
  removeQuestion: string;
  icon?: IconName;
  columns: CrudColumn[];
  fields: CrudField[];
  emptyInput: Record<string, unknown>;
  searchable?: boolean;
}>();

const { rows, page, pageCount, search, isLoading, refresh, remove } = useAdminList<Row>(props.resource);
const { isBusy, errorMessage, run } = useApiAction();
const toasts = useToastStore();
const fetchStored = useAdminRecord();
const { t } = useI18n();

const editedId = ref<number | null>(null);
const isFormOpen = ref(false);
const input = ref<Record<string, unknown>>({ ...props.emptyInput });

const openNew = () => {
  errorMessage.value = '';
  editedId.value = null;
  input.value = { ...props.emptyInput };
  isFormOpen.value = true;
};

const openExisting = async (id: number) => {
  const stored = await fetchStored<Record<string, unknown>>(props.resource, id);
  if (!stored) {
    return;
  }
  errorMessage.value = '';
  input.value = Object.fromEntries(
    Object.keys(props.emptyInput).map((key) => [key, stored[key] ?? props.emptyInput[key]]),
  );
  editedId.value = id;
  isFormOpen.value = true;
};

const save = async () => {
  const wasSaved = await run(() =>
    editedId.value === null
      ? apiRequest(`/api/admin/${props.resource}`, { method: 'POST', body: input.value })
      : apiRequest(`/api/admin/${props.resource}/${editedId.value}`, { method: 'PUT', body: input.value }),
  );
  if (wasSaved) {
    toasts.success(t('GENERAL.SAVED'));
    isFormOpen.value = false;
    await refresh();
  }
};

useSeoMeta({ title: props.title });
</script>

<template>
  <div>
    <AdminHeader :title="title" :subtitle="subtitle">
      <BaseInput
        v-if="searchable"
        v-model="search"
        type="search"
        :label="t('GENERAL.SEARCH')"
        :placeholder="t('GENERAL.SEARCH_PLACEHOLDER')"
        hide-label
        class="w-56"
      />
      <BaseButton @click="openNew">
        <AppIcon name="plus" />
        {{ addLabel }}
      </BaseButton>
    </AdminHeader>

    <form v-if="isFormOpen" class="mb-6 flex animate-rise flex-col gap-4 panel p-5" @submit.prevent="save">
      <h2 class="heading-display text-lg text-gold-300">
        {{ editedId === null ? addLabel : t('GENERAL.EDITING') }}
      </h2>
      <div class="grid gap-4 md:grid-cols-2">
        <template v-for="field in fields" :key="field.key">
          <BaseTextarea
            v-if="field.kind === 'textarea'"
            v-model="input[field.key] as string"
            class="md:col-span-2"
            :label="field.label"
            :hint="field.hint"
            :required="field.required"
          />
          <div v-else-if="field.kind === 'richText'" class="flex flex-col gap-1.5 md:col-span-2">
            <p class="text-xs font-semibold tracking-wide text-aqua-300 uppercase">{{ field.label }}</p>
            <ClientOnly>
              <RichTextEditor v-model="input[field.key] as string" :label="field.label" extended allows-upload />
            </ClientOnly>
          </div>
          <BaseCheckbox
            v-else-if="field.kind === 'checkbox'"
            v-model="input[field.key] as boolean"
            :label="field.label"
            :hint="field.hint"
          />
          <BaseSelect
            v-else-if="field.kind === 'select'"
            v-model="input[field.key] as string | number"
            :label="field.label"
            :options="field.options ?? []"
            :hint="field.hint"
            :required="field.required"
          />
          <ImageField
            v-else-if="field.kind === 'image'"
            v-model="input[field.key] as string | null"
            :label="field.label"
            :hint="field.hint"
          />
          <BaseInput
            v-else-if="field.kind === 'number'"
            :model-value="String(input[field.key] ?? 0)"
            type="number"
            :label="field.label"
            :hint="field.hint"
            :required="field.required"
            @update:model-value="input[field.key] = Number($event)"
          />
          <BaseInput
            v-else
            v-model="input[field.key] as string"
            :type="field.kind === 'url' ? 'url' : 'text'"
            :label="field.label"
            :hint="field.hint"
            :required="field.required"
          />
        </template>
      </div>
      <p v-if="errorMessage" class="flex items-center gap-2 text-sm text-danger" role="alert">
        <AppIcon name="warning" />
        {{ errorMessage }}
      </p>
      <div class="flex flex-wrap gap-2">
        <BaseButton type="submit" :busy="isBusy">
          <AppIcon name="check" />
          {{ t('GENERAL.SAVE') }}
        </BaseButton>
        <BaseButton variant="ghost" @click="isFormOpen = false">{{ t('GENERAL.CANCEL') }}</BaseButton>
      </div>
    </form>

    <AdminTable :columns="columns" :rows="rows" :is-loading="isLoading">
      <template v-for="column in columns" :key="column.key" #[`cell-${column.key}`]="{ row }">
        <slot :name="`cell-${column.key}`" :row="row">{{ cellText(row, column.key) }}</slot>
      </template>
      <template #actions="{ row }">
        <slot name="row-actions" :row="row" />
        <BaseButton variant="ghost" size="sm" @click="openExisting(row.id)">
          <AppIcon name="edit" />
          {{ t('GENERAL.EDIT') }}
        </BaseButton>
        <ConfirmButton :question="removeQuestion" @confirm="remove(row.id)" />
      </template>
    </AdminTable>
    <PageStepper v-model="page" :page-count="pageCount" />
  </div>
</template>
