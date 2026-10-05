<script setup lang="ts">
import { withLocalePrefix } from '#shared/utils/locales';
import { MINIMUM_SEARCH_LENGTH } from '#shared/utils/search';
import { MAIN_NAVIGATION } from '~/utils/mainNavigation';

const TYPING_PAUSE_MS = 250;
const NuxtLinkLocale = resolveComponent('NuxtLinkLocale');

const ui = useUiStore();
const { t, locale } = useI18n();
const route = useRoute();

const typedPhrase = ref('');
const searchedPhrase = ref('');
const phrase = computed(() => typedPhrase.value.trim());
const isPhraseTooShort = computed(() => phrase.value.length < MINIMUM_SEARCH_LENGTH);

const {
  data: results,
  status,
  execute: fetchResults,
} = useFetch('/api/search', {
  query: { q: searchedPhrase },
  immediate: false,
  server: false,
  watch: false,
});

let typingPause: ReturnType<typeof setTimeout> | undefined;

const searchNow = () => {
  clearTimeout(typingPause);
  if (!isPhraseTooShort.value) {
    searchedPhrase.value = phrase.value;
    fetchResults();
  }
};

watch(phrase, () => {
  clearTimeout(typingPause);
  typingPause = setTimeout(searchNow, TYPING_PAUSE_MS);
});

const sections = computed(() =>
  [
    { title: t('SEARCH.PAGES'), items: results.value?.pages ?? [] },
    { title: t('GENERAL.NEWS'), items: results.value?.news ?? [] },
    { title: t('FAQ.TITLE'), items: results.value?.faq ?? [] },
    { title: t('GENERAL.FORUM'), items: results.value?.forum ?? [] },
  ].filter((section) => section.items.length),
);
const isSearching = computed(() => status.value === 'pending' || searchedPhrase.value !== phrase.value);
const isForumPost = (url: string) => url.startsWith('/forum/post/');

const openOnShortcut = (event: KeyboardEvent) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    ui.openSearch();
  }
};

watch(() => route.fullPath, ui.closeSearch);
onMounted(() => window.addEventListener('keydown', openOnShortcut));
onBeforeUnmount(() => {
  window.removeEventListener('keydown', openOnShortcut);
  clearTimeout(typingPause);
});
</script>

<template>
  <BaseDialog v-model="ui.isSearchOpen" :title="t('GENERAL.SEARCH')">
    <form class="sticky -top-5 z-10 -mx-5 -mt-5 bg-abyss-900 px-5 pt-5 pb-4" role="search" @submit.prevent="searchNow">
      <BaseInput
        v-model="typedPhrase"
        type="search"
        :label="t('SEARCH.PHRASE_LABEL')"
        hide-label
        autofocus
        :placeholder="t('SEARCH.PHRASE_PLACEHOLDER')"
        :hint="t('SEARCH.SUBTITLE')"
        :maxlength="100"
      />
    </form>

    <div aria-live="polite">
      <nav v-if="!phrase" :aria-label="t('SEARCH.SHORTCUTS')">
        <h3 class="mb-3 text-xs font-semibold tracking-wide text-aqua-300 uppercase">{{ t('SEARCH.SHORTCUTS') }}</h3>
        <ul class="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <li v-for="item in MAIN_NAVIGATION" :key="item.to">
            <NuxtLinkLocale
              :to="item.to"
              class="flex items-center gap-2 rounded-lg border border-cosmo-500/30 px-3 py-2 font-display text-sm font-semibold tracking-wider text-cosmo-400 uppercase transition duration-200 hover:bg-cosmo-500/10 hover:text-gold-300"
              @click="ui.closeSearch"
            >
              <AppIcon :name="item.icon" />
              {{ t(item.labelKey) }}
            </NuxtLinkLocale>
          </li>
        </ul>
      </nav>
      <p v-else-if="isPhraseTooShort" class="py-6 text-center text-sm text-aqua-300">
        {{ t('SEARCH.PHRASE_TOO_SHORT', { count: MINIMUM_SEARCH_LENGTH }) }}
      </p>
      <p v-else-if="isSearching && !sections.length" class="py-6 text-center text-sm text-aqua-300">
        {{ t('GENERAL.LOADING') }}
      </p>
      <p v-else-if="!sections.length" class="py-6 text-center text-sm text-aqua-300">
        {{ t('SEARCH.NOTHING_FOUND', { phrase }) }}
      </p>
      <div v-else class="flex flex-col gap-6 transition duration-200" :class="{ 'opacity-60': isSearching }">
        <section v-for="section in sections" :key="section.title">
          <h3 class="mb-2 heading-display text-base text-gold-300">{{ section.title }} ({{ section.items.length }})</h3>
          <ul class="flex flex-col gap-1">
            <li v-for="result in section.items" :key="result.url">
              <component
                :is="isForumPost(result.url) ? 'a' : NuxtLinkLocale"
                :href="isForumPost(result.url) ? withLocalePrefix(result.url, locale) : undefined"
                :to="isForumPost(result.url) ? undefined : result.url"
                class="block rounded-lg border border-transparent px-3 py-2 transition duration-200 hover:border-cosmo-500/40 hover:bg-white/5 focus-visible:border-cosmo-500/60 focus-visible:bg-white/5 focus-visible:outline-none"
                @click="ui.closeSearch"
              >
                <span class="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span class="font-semibold text-gold-300">{{ result.title }}</span>
                  <span class="text-[0.7rem] text-aqua-500">{{ result.context }}</span>
                </span>
                <span class="mt-0.5 line-clamp-2 block text-sm text-aqua-200">{{ result.excerpt }}</span>
              </component>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </BaseDialog>
</template>
