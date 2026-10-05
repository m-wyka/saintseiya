<script setup lang="ts">
interface FoundPage {
  id: number;
  title: string;
  path: string;
}

defineProps<{ label: string; selectedTitle: string | null }>();
const emit = defineEmits<{ select: [page: FoundPage] }>();

const { t } = useI18n();

const SEARCH_DEBOUNCE_MS = 250;
const search = ref('');
const results = ref<FoundPage[]>([]);
let searchTimer: ReturnType<typeof setTimeout> | undefined;

watch(search, (text) => {
  clearTimeout(searchTimer);
  if (!text.trim()) {
    results.value = [];
    return;
  }
  searchTimer = setTimeout(async () => {
    results.value = await $fetch<FoundPage[]>('/api/admin/lookup/pages', { query: { search: text } });
  }, SEARCH_DEBOUNCE_MS);
});

const choose = (page: FoundPage) => {
  emit('select', page);
  search.value = '';
  results.value = [];
};

onBeforeUnmount(() => clearTimeout(searchTimer));
</script>

<template>
  <div class="flex flex-col gap-2">
    <p class="text-sm text-aqua-200">
      <span class="text-xs font-semibold tracking-wide text-aqua-300 uppercase">
        {{ t('ADMIN_FORMS.PAGE_SELECTED') }}
      </span>
      {{ selectedTitle ?? t('ADMIN_FORMS.PAGE_NONE') }}
    </p>
    <BaseInput v-model="search" type="search" :label="label" :placeholder="t('ADMIN_FORMS.PAGE_TITLE_PLACEHOLDER')" />
    <ul v-if="results.length" class="max-h-56 overflow-y-auto rounded-lg border border-aqua-500/30 bg-black/40">
      <li v-for="page in results" :key="page.id">
        <button
          type="button"
          class="flex w-full cursor-pointer flex-col px-3 py-1.5 text-left text-sm text-aqua-200 transition hover:bg-white/10 hover:text-gold-300"
          @click="choose(page)"
        >
          {{ page.title }}
          <span class="text-[0.7rem] text-aqua-500">/{{ page.path }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>
