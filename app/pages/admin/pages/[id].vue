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

const { t } = useI18n();

const statusOptions = computed<{ value: ContentStatus; label: string }[]>(() => [
  { value: 'draft', label: t('ADMIN_PAGES.STATUS_DRAFT') },
  { value: 'published', label: t('ADMIN_PAGES.STATUS_PUBLISHED') },
]);
const kindOptions = computed<{ value: PageKind; label: string }[]>(() => [
  { value: 'article', label: t(PAGE_KIND_LABEL_KEYS.article) },
  { value: 'hub', label: t(PAGE_KIND_LABEL_KEYS.hub) },
]);

const route = useRoute();
const routeId = useRouteParam('id');
const { input, isNew, isBusy, errorMessage, save } = await useAdminForm<PageInput>({
  resource: 'pages',
  recordId: routeId.value,
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

const editedPageId = isNew ? undefined : Number(routeId.value);
const tags = await $fetch<{ id: number; name: string }[]>('/api/admin/lookup/tags');

const toggleTag = (tagId: number) => {
  input.value.tagIds = input.value.tagIds.includes(tagId)
    ? input.value.tagIds.filter((id) => id !== tagId)
    : [...input.value.tagIds, tagId];
};

const pageTitle = computed(() => t(isNew ? 'ADMIN_PAGES.NEW_PAGE' : 'ADMIN_PAGES.EDIT_PAGE'));

useSeoMeta({ title: pageTitle });
</script>

<template>
  <form @submit.self.prevent="save">
    <AdminHeader :title="pageTitle" />
    <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div class="flex flex-col gap-5 panel p-5">
        <BaseInput v-model="input.title" :label="t('GENERAL.TITLE')" :maxlength="200" required />
        <div class="flex flex-col gap-1.5">
          <p class="text-xs font-semibold tracking-wide text-aqua-300 uppercase">{{ t('GENERAL.CONTENT') }}</p>
          <ClientOnly>
            <RichTextEditor v-model="input.bodyHtml" :label="t('GENERAL.CONTENT')" extended allows-upload />
          </ClientOnly>
        </div>
      </div>

      <aside class="flex flex-col gap-5 self-start panel p-5">
        <BaseSelect v-model="input.status" :label="t('GENERAL.STATUS')" :options="statusOptions" />
        <BaseSelect
          v-model="input.kind"
          :label="t('ADMIN_PAGES.KIND')"
          :options="kindOptions"
          :hint="t('ADMIN_PAGES.KIND_HINT')"
        />
        <PageParentPicker v-model="input.parentId" :moved-page-id="editedPageId" />
        <BaseInput v-model="input.slug" :label="t('ADMIN_PAGES.SLUG')" :hint="t('ADMIN_PAGES.SLUG_HINT')" />
        <BaseCheckbox v-model="input.commentsEnabled" :label="t('ADMIN_PAGES.COMMENTS_ENABLED')" />
        <fieldset class="flex flex-col gap-2">
          <legend class="mb-1 text-xs font-semibold tracking-wide text-aqua-300 uppercase">
            {{ t('ADMIN_PAGES.TAGS') }}
          </legend>
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
            <i18n-t keypath="ADMIN_PAGES.NO_TAGS" scope="global">
              <template #link>
                <NuxtLinkLocale to="/admin/tagi" class="text-cosmo-400 hover:text-gold-300">{{
                  t('ADMIN_PAGES.ADD_FIRST_TAG')
                }}</NuxtLinkLocale>
              </template>
            </i18n-t>
          </p>
        </fieldset>
        <FormActions :cancel-to="adminPageLevelPath(input.parentId)" :is-busy="isBusy" :error-message="errorMessage" />
      </aside>
    </div>
  </form>
</template>
