<script setup lang="ts">
import type { ContentStatus } from '#shared/utils/content';

definePageMeta({ layout: 'admin' });

interface NewsInput extends Record<string, unknown> {
  title: string;
  slug: string;
  categoryId: number | null;
  tagIds: number[];
  excerptHtml: string;
  bodyHtml: string;
  status: ContentStatus;
  commentsEnabled: boolean;
  publishedAt: string | null;
}

const NO_CATEGORY = 0;
const LIST_PATH = '/admin/newsy';
const STATUS_OPTIONS: { value: ContentStatus; label: string }[] = [
  { value: 'draft', label: 'Szkic' },
  { value: 'published', label: 'Opublikowany' },
];

const route = useRoute('admin-newsy-id');
const { input, isNew, isBusy, errorMessage, save } = await useAdminForm<NewsInput>({
  resource: 'news',
  recordId: route.params.id,
  listPath: LIST_PATH,
  emptyInput: {
    title: '',
    slug: '',
    categoryId: null,
    tagIds: [],
    excerptHtml: '',
    bodyHtml: '',
    status: 'draft',
    commentsEnabled: true,
    publishedAt: null,
  },
});

const [categories, tags] = await Promise.all([
  $fetch<{ id: number; name: string }[]>('/api/admin/news-categories'),
  $fetch<{ id: number; name: string }[]>('/api/admin/lookup/tags'),
]);

const categoryOptions = [
  { value: NO_CATEGORY, label: 'Bez kategorii' },
  ...categories.map(({ id, name }) => ({ value: id, label: name })),
];
const selectedCategory = computed({
  get: () => input.value.categoryId ?? NO_CATEGORY,
  set: (categoryId: number) => (input.value.categoryId = categoryId === NO_CATEGORY ? null : categoryId),
});

const toggleTag = (tagId: number) => {
  input.value.tagIds = input.value.tagIds.includes(tagId)
    ? input.value.tagIds.filter((id) => id !== tagId)
    : [...input.value.tagIds, tagId];
};

useSeoMeta({ title: isNew ? 'Nowy news' : 'Edycja newsa' });
</script>

<template>
  <form @submit.prevent="save">
    <AdminHeader :title="isNew ? 'Nowy news' : 'Edycja newsa'" />
    <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div class="flex flex-col gap-5 panel p-5">
        <BaseInput v-model="input.title" label="Tytuł" :maxlength="200" required />
        <div class="flex flex-col gap-1.5">
          <p class="text-xs font-semibold tracking-wide text-aqua-300 uppercase">Zajawka</p>
          <ClientOnly><RichTextEditor v-model="input.excerptHtml" label="Zajawka" extended allows-upload /></ClientOnly>
        </div>
        <div class="flex flex-col gap-1.5">
          <p class="text-xs font-semibold tracking-wide text-aqua-300 uppercase">Rozwinięcie (opcjonalne)</p>
          <ClientOnly
            ><RichTextEditor v-model="input.bodyHtml" label="Rozwinięcie" extended allows-upload
          /></ClientOnly>
        </div>
      </div>

      <aside class="flex flex-col gap-5 self-start panel p-5">
        <BaseSelect v-model="input.status" label="Status" :options="STATUS_OPTIONS" />
        <BaseSelect v-model="selectedCategory" label="Kategoria" :options="categoryOptions" />
        <BaseInput v-model="input.slug" label="Adres (slug)" hint="Puste pole = adres utworzy się z tytułu" />
        <BaseCheckbox v-model="input.commentsEnabled" label="Komentarze włączone" />
        <fieldset class="flex flex-col gap-2">
          <legend class="mb-1 text-xs font-semibold tracking-wide text-aqua-300 uppercase">Tagi</legend>
          <div v-if="tags.length" class="flex flex-wrap gap-1.5">
            <button
              v-for="tag in tags"
              :key="tag.id"
              type="button"
              class="cursor-pointer rounded-full border px-2.5 py-0.5 text-xs transition duration-150"
              :class="
                input.tagIds.includes(tag.id)
                  ? 'border-transparent cosmo-bar font-semibold text-abyss-950'
                  : 'border-aqua-500/30 text-aqua-200 hover:border-cosmo-500'
              "
              :aria-pressed="input.tagIds.includes(tag.id)"
              @click="toggleTag(tag.id)"
            >
              {{ tag.name }}
            </button>
          </div>
          <p v-else class="text-xs text-aqua-500">
            Nie ma jeszcze tagów.
            <NuxtLink to="/admin/tagi" class="text-cosmo-400 hover:text-gold-300">Dodaj pierwszy</NuxtLink>.
          </p>
        </fieldset>
        <FormActions :cancel-to="LIST_PATH" :is-busy="isBusy" :error-message="errorMessage" />
      </aside>
    </div>
  </form>
</template>
