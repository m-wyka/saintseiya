<script setup lang="ts">
const MINIMUM_PHRASE_LENGTH = 3;
const NuxtLink = resolveComponent('NuxtLink');

const route = useRoute();
const phrase = computed(() => String(route.query.q ?? '').trim());
const typedPhrase = ref(phrase.value);

const { data: results, status } = await useFetch('/api/search', { query: { q: phrase } });

const sections = computed(() => [
  { title: 'Podstrony', items: results.value?.pages ?? [] },
  { title: 'Newsy', items: results.value?.news ?? [] },
  { title: 'Forum', items: results.value?.forum ?? [] },
]);
const resultCount = computed(() => sections.value.reduce((total, section) => total + section.items.length, 0));
const isPhraseTooShort = computed(() => phrase.value.length > 0 && phrase.value.length < MINIMUM_PHRASE_LENGTH);
const isForumPost = (url: string) => url.startsWith('/forum/post/');

const search = () => navigateTo({ query: { q: typedPhrase.value.trim() || undefined } });

watch(phrase, (current) => (typedPhrase.value = current));

useSeoMeta({ title: () => (phrase.value ? `Szukaj: ${phrase.value}` : 'Szukaj'), robots: 'noindex' });
</script>

<template>
  <div>
    <PageHeading title="Szukaj" subtitle="Przeszukuje podstrony, newsy i forum." />
    <form
      class="mb-6 flex items-end gap-3 panel p-4"
      role="search"
      method="get"
      action="/szukaj"
      @submit.prevent="search"
    >
      <BaseInput
        v-model="typedPhrase"
        class="flex-1"
        type="search"
        label="Szukana fraza"
        name="q"
        placeholder="np. Posejdon, Lost Canvas, zbroja…"
        :maxlength="100"
      />
      <BaseButton type="submit">
        <AppIcon name="search" />
        Szukaj
      </BaseButton>
    </form>

    <EmptyState v-if="!phrase" message="Wpisz frazę, aby rozpocząć wyszukiwanie." />
    <EmptyState v-else-if="isPhraseTooShort" :message="`Fraza musi mieć co najmniej ${MINIMUM_PHRASE_LENGTH} znaki.`" />
    <EmptyState v-else-if="status === 'success' && !resultCount" :message="`Nic nie znaleziono dla „${phrase}”.`" />
    <div v-else class="flex flex-col gap-8" :class="{ 'opacity-60': status === 'pending' }">
      <section v-for="section in sections.filter((candidate) => candidate.items.length)" :key="section.title">
        <SectionHeading :title="`${section.title} (${section.items.length})`" />
        <ul class="flex flex-col gap-3">
          <li v-for="result in section.items" :key="result.url" class="reveal">
            <component
              :is="isForumPost(result.url) ? 'a' : NuxtLink"
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
