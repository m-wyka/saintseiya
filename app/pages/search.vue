<script setup lang="ts">
import { routes } from '#shared/utils/routes';

const MINIMUM_PHRASE_LENGTH = 3;
const NuxtLinkLocale = resolveComponent('NuxtLinkLocale');

const { t } = useI18n();
const localePath = useLocalePath();
const route = useRoute();
const phrase = computed(() => String(route.query.q ?? '').trim());
const typedPhrase = ref(phrase.value);

const { data: results, status } = await useFetch('/api/search', { query: { q: phrase } });

const sections = computed(() => [
  { title: t('SEARCH.PAGES'), items: results.value?.pages ?? [] },
  { title: t('GENERAL.NEWS'), items: results.value?.news ?? [] },
  { title: t('GENERAL.FORUM'), items: results.value?.forum ?? [] },
]);
const resultCount = computed(() => sections.value.reduce((total, section) => total + section.items.length, 0));
const isPhraseTooShort = computed(() => phrase.value.length > 0 && phrase.value.length < MINIMUM_PHRASE_LENGTH);
const isForumPost = (url: string) => url.startsWith('/forum/post/');

const search = () => navigateTo({ query: { q: typedPhrase.value.trim() || undefined } });

watch(phrase, (current) => (typedPhrase.value = current));

useSeoMeta({
  title: () => (phrase.value ? t('SEARCH.TITLE_WITH_PHRASE', { phrase: phrase.value }) : t('GENERAL.SEARCH')),
  robots: 'noindex',
});
</script>

<template>
  <div>
    <PageHeading :title="t('GENERAL.SEARCH')" :subtitle="t('SEARCH.SUBTITLE')" />
    <form
      class="mb-6 flex items-end gap-3 panel p-4"
      role="search"
      method="get"
      :action="localePath(routes.search())"
      @submit.prevent="search"
    >
      <BaseInput
        v-model="typedPhrase"
        class="flex-1"
        type="search"
        :label="t('SEARCH.PHRASE_LABEL')"
        name="q"
        :placeholder="t('SEARCH.PHRASE_PLACEHOLDER')"
        :maxlength="100"
      />
      <BaseButton type="submit">
        <AppIcon name="search" />
        {{ t('GENERAL.SEARCH') }}
      </BaseButton>
    </form>

    <EmptyState v-if="!phrase" :message="t('SEARCH.ENTER_PHRASE')" />
    <EmptyState
      v-else-if="isPhraseTooShort"
      :message="t('SEARCH.PHRASE_TOO_SHORT', { count: MINIMUM_PHRASE_LENGTH })"
    />
    <EmptyState v-else-if="status === 'success' && !resultCount" :message="t('SEARCH.NOTHING_FOUND', { phrase })" />
    <div v-else class="flex flex-col gap-8" :class="{ 'opacity-60': status === 'pending' }">
      <section v-for="section in sections.filter((candidate) => candidate.items.length)" :key="section.title">
        <SectionHeading :title="`${section.title} (${section.items.length})`" />
        <ul class="flex flex-col gap-3">
          <li v-for="result in section.items" :key="result.url" class="reveal">
            <component
              :is="isForumPost(result.url) ? 'a' : NuxtLinkLocale"
              :href="isForumPost(result.url) ? result.url : undefined"
              :to="isForumPost(result.url) ? undefined : result.url"
              class="block panel px-5 py-3 transition duration-300 ease-cosmo hover:-translate-y-0.5 hover:border-cosmo-500/60"
            >
              <span class="block font-semibold text-gold-300">{{ result.title }}</span>
              <span class="block text-[0.7rem] text-aqua-500">{{ result.context }}</span>
              <span class="mt-1 block text-sm text-aqua-200">{{ result.excerpt }}</span>
            </component>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
