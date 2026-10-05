<script setup lang="ts">
import type { ContentStatus, PageKind } from '#shared/utils/content';

definePageMeta({ layout: 'admin' });

interface PageInput extends Record<string, unknown> {
  title: string;
  slug: string;
  parentId: number | null;
  kind: PageKind;
  bodyHtml: string;
  status: ContentStatus;
  commentsEnabled: boolean;
  tagIds: number[];
}

const STATUS_OPTIONS: { value: ContentStatus; label: string }[] = [
  { value: 'draft', label: 'Szkic' },
  { value: 'published', label: 'Opublikowany' },
];
const KIND_OPTIONS: { value: PageKind; label: string }[] = [
  { value: 'article', label: PAGE_KIND_LABELS.article },
  { value: 'hub', label: PAGE_KIND_LABELS.hub },
];

const route = useRoute('admin-strony-id');
const { input, isNew, isBusy, errorMessage, save } = await useAdminForm<PageInput>({
  resource: 'pages',
  recordId: route.params.id,
  listPath: (savedInput) => adminPageLevelPath(savedInput.parentId),
  emptyInput: {
    title: '',
    slug: '',
    parentId: null,
    kind: 'article',
    bodyHtml: '',
    status: 'draft',
    commentsEnabled: true,
    tagIds: [],
  },
});

if (isNew) {
  input.value.parentId = Number(route.query.parent) || null;
}

const editedPageId = isNew ? undefined : Number(route.params.id);
const tags = await $fetch<{ id: number; name: string }[]>('/api/admin/lookup/tags');

const toggleTag = (tagId: number) => {
  input.value.tagIds = input.value.tagIds.includes(tagId)
    ? input.value.tagIds.filter((id) => id !== tagId)
    : [...input.value.tagIds, tagId];
};

useSeoMeta({ title: isNew ? 'Nowa strona' : 'Edycja strony' });
</script>

<template>
  <form @submit.self.prevent="save">
    <AdminHeader :title="isNew ? 'Nowa strona' : 'Edycja strony'" />
    <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div class="flex flex-col gap-5 panel p-5">
        <BaseInput v-model="input.title" label="Tytuł" :maxlength="200" required />
        <div class="flex flex-col gap-1.5">
          <p class="text-xs font-semibold tracking-wide text-aqua-300 uppercase">Treść</p>
          <ClientOnly><RichTextEditor v-model="input.bodyHtml" label="Treść" extended allows-upload /></ClientOnly>
        </div>
      </div>

      <aside class="flex flex-col gap-5 self-start panel p-5">
        <BaseSelect v-model="input.status" label="Status" :options="STATUS_OPTIONS" />
        <BaseSelect
          v-model="input.kind"
          label="Typ strony"
          :options="KIND_OPTIONS"
          hint="Artykuł pokazuje własną treść i komentarze. Hub pokazuje listę swoich podstron, tworzoną automatycznie (pod treścią, jeśli ją ma), i nie ma komentarzy."
        />
        <PageParentPicker v-model="input.parentId" :moved-page-id="editedPageId" />
        <BaseInput
          v-model="input.slug"
          label="Adres (slug)"
          hint="Puste pole = adres utworzy się z tytułu. Zmiana adresu lub strony nadrzędnej zmienia też adresy wszystkich podstron, a odnośniki do nich w treściach i nawigacji trzeba poprawić ręcznie."
        />
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
        <FormActions :cancel-to="adminPageLevelPath(input.parentId)" :is-busy="isBusy" :error-message="errorMessage" />
      </aside>
    </div>
  </form>
</template>
