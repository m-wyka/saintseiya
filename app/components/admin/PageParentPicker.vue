<script setup lang="ts">
interface ParentPage {
  id: number;
  title: string;
  path: string;
}

const parentId = defineModel<number | null>({ required: true });
const props = defineProps<{ movedPageId?: number }>();

const { t } = useI18n();

const SEARCH_DEBOUNCE_MS = 250;

const search = ref('');
const candidates = ref<ParentPage[]>([]);
const answeredSearch = ref('');
const chosenParent = ref<ParentPage | null>(null);
let searchTimer: ReturnType<typeof setTimeout> | undefined;

const wantedTitle = computed(() => search.value.trim());
const hasNoCandidates = computed(
  () => wantedTitle.value !== '' && answeredSearch.value === wantedTitle.value && !candidates.value.length,
);

const loadCandidates = async (title: string) => {
  const found = title
    ? await $fetch<ParentPage[]>('/api/admin/page-tree/parents', {
        query: { search: title, pageId: props.movedPageId },
      }).catch(() => [])
    : [];
  if (title === wantedTitle.value) {
    candidates.value = found;
    answeredSearch.value = title;
  }
};

const choose = (parent: ParentPage | null) => {
  chosenParent.value = parent;
  parentId.value = parent?.id ?? null;
  search.value = '';
  candidates.value = [];
};

watch(wantedTitle, (title) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadCandidates(title), SEARCH_DEBOUNCE_MS);
});

watch(
  parentId,
  async (id) => {
    if (id === null || id === chosenParent.value?.id) {
      return;
    }
    chosenParent.value = await $fetch<ParentPage>(`/api/admin/pages/${id}`).catch(() => null);
  },
  { immediate: true },
);

onBeforeUnmount(() => clearTimeout(searchTimer));
</script>

<template>
  <fieldset class="flex flex-col gap-2">
    <legend class="mb-1.5 text-xs font-semibold tracking-wide text-aqua-300 uppercase">
      {{ t('ADMIN_FORMS.PARENT_LEGEND') }}
    </legend>
    <div class="rounded-lg border border-aqua-500/30 bg-black/40 px-3 py-2 text-sm">
      <template v-if="parentId !== null">
        <p class="font-semibold text-mist">{{ chosenParent?.title ?? '…' }}</p>
        <p v-if="chosenParent" class="text-xs break-all text-aqua-500">/{{ chosenParent.path }}</p>
      </template>
      <p v-else class="text-aqua-200">{{ t('ADMIN_FORMS.PARENT_NONE') }}</p>
    </div>
    <BaseButton v-if="parentId !== null" variant="ghost" size="sm" class="self-start" @click="choose(null)">
      <AppIcon name="home" />
      {{ t('ADMIN_FORMS.PARENT_MOVE_TO_ROOT') }}
    </BaseButton>
    <BaseInput
      v-model="search"
      type="search"
      :label="t('ADMIN_FORMS.PARENT_CHANGE')"
      :placeholder="t('ADMIN_FORMS.PAGE_TITLE_PLACEHOLDER')"
      @keydown.enter.prevent
    />
    <ul v-if="candidates.length" class="flex max-h-72 flex-col overflow-y-auto rounded-lg border border-aqua-500/30">
      <li v-for="candidate in candidates" :key="candidate.id" class="border-b border-aqua-500/10 last:border-b-0">
        <button
          type="button"
          class="block w-full cursor-pointer px-3 py-2 text-left text-sm transition duration-150 hover:bg-white/5"
          @click="choose(candidate)"
        >
          <span class="block text-aqua-200">{{ candidate.title }}</span>
          <span class="block text-xs break-all text-aqua-500">/{{ candidate.path }}</span>
        </button>
      </li>
    </ul>
    <p v-else-if="hasNoCandidates" class="text-xs text-aqua-500">{{ t('ADMIN_FORMS.PARENT_NO_MATCH') }}</p>
  </fieldset>
</template>
