<script setup lang="ts">
import { MAP_AREA_TARGETS } from '#shared/utils/content';
import type { ContentStatus } from '#shared/utils/content';
import { routes } from '#shared/utils/routes';
import { MAP_AREA_TARGET_LABEL_KEYS } from '~/utils/mapAreas';
import type { EditableMapArea } from '~/utils/mapAreas';

definePageMeta({ layout: 'admin' });

interface MapInput extends Record<string, unknown> {
  title: string;
  slug: string;
  description: string;
  image: string;
  imageWidth: number;
  imageHeight: number;
  teaserImage: string | null;
  status: ContentStatus;
  sortOrder: number;
  areas: EditableMapArea[];
}

const LIST_PATH = '/admin/mapy';

const { t } = useI18n();

const statusOptions = computed<{ value: ContentStatus; label: string }[]>(() => [
  { value: 'draft', label: t('ADMIN_MAPS.STATUS_DRAFT') },
  { value: 'published', label: t('ADMIN_MAPS.STATUS_PUBLISHED') },
]);
const targetOptions = computed(() =>
  MAP_AREA_TARGETS.map((value) => ({ value, label: t(MAP_AREA_TARGET_LABEL_KEYS[value]) })),
);

const routeId = useRouteParam('id');
const { input, isNew, isBusy, errorMessage, save } = await useAdminForm<MapInput>({
  resource: 'maps',
  recordId: routeId.value,
  listPath: LIST_PATH,
  emptyInput: {
    title: '',
    slug: '',
    description: '',
    image: '',
    imageWidth: 0,
    imageHeight: 0,
    teaserImage: null,
    status: 'draft',
    sortOrder: 0,
    areas: [],
  },
});

const selectedIndex = ref<number | null>(null);
const selectedArea = computed(() =>
  selectedIndex.value === null ? null : (input.value.areas[selectedIndex.value] ?? null),
);

const imageUpload = useApiAction();
const imageInput = ref<HTMLInputElement | null>(null);

const uploadMapImage = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) {
    return;
  }
  const form = new FormData();
  form.append('file', file);
  await imageUpload.run(async () => {
    const stored = await apiRequest<{ image: string; width: number; height: number }>(
      '/api/admin/uploads-image?folder=maps',
      {
        method: 'POST',
        body: form,
      },
    );
    input.value.image = stored.image;
    input.value.imageWidth = stored.width;
    input.value.imageHeight = stored.height;
  });
};

const removeSelectedArea = () => {
  input.value.areas = input.value.areas.filter((_, index) => index !== selectedIndex.value);
  selectedIndex.value = null;
};

const choosePage = (page: { id: number; title: string }) => {
  if (selectedArea.value) {
    selectedArea.value.pageId = page.id;
    selectedArea.value.pageTitle = page.title;
  }
};

const selectedContent = computed(() => selectedArea.value?.contentHtml ?? '');

const setAreaUrl = (url: string) => {
  if (selectedArea.value) {
    selectedArea.value.url = url;
  }
};

const setAreaContent = (contentHtml: string) => {
  if (selectedArea.value) {
    selectedArea.value.contentHtml = contentHtml;
  }
};

const pageTitle = computed(() => t(isNew ? 'ADMIN_MAPS.NEW_MAP' : 'ADMIN_MAPS.EDIT_MAP'));

useSeoMeta({ title: pageTitle });
</script>

<template>
  <form @submit.self.prevent="save">
    <AdminHeader
      :title="pageTitle"
      :subtitle="input.image ? t('ADMIN_MAPS.AREA_COUNT', { count: input.areas.length }) : undefined"
    />

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div class="flex min-w-0 flex-col gap-4">
        <div class="flex flex-wrap items-center gap-3 panel p-4">
          <input
            ref="imageInput"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            class="sr-only"
            :aria-label="t('ADMIN_MAPS.MAP_IMAGE')"
            @change="uploadMapImage"
          />
          <BaseButton variant="secondary" :busy="imageUpload.isBusy.value" @click="imageInput?.click()">
            <AppIcon name="image" />
            {{ input.image ? t('ADMIN_MAPS.CHANGE_IMAGE') : t('ADMIN_MAPS.UPLOAD_IMAGE') }}
          </BaseButton>
          <p class="text-xs text-aqua-500">
            {{
              input.image
                ? t('ADMIN_MAPS.DRAW_HINT', { width: input.imageWidth, height: input.imageHeight })
                : t('ADMIN_MAPS.UPLOAD_HINT')
            }}
          </p>
          <p v-if="imageUpload.errorMessage.value" class="w-full text-sm text-danger" role="alert">
            {{ imageUpload.errorMessage.value }}
          </p>
        </div>

        <MapAreaCanvas
          v-if="input.image"
          v-model:areas="input.areas"
          v-model:selected-index="selectedIndex"
          :image-url="routes.media(input.image)"
          :image-width="input.imageWidth"
          :image-height="input.imageHeight"
        />

        <section v-if="selectedArea" class="flex animate-rise flex-col gap-4 panel p-5">
          <div class="flex items-center justify-between gap-3">
            <h2 class="heading-display text-lg text-gold-300">{{ t('ADMIN_MAPS.SELECTED_AREA') }}</h2>
            <BaseButton variant="danger" size="sm" @click="removeSelectedArea">
              <AppIcon name="trash" />
              {{ t('ADMIN_MAPS.DELETE_AREA') }}
            </BaseButton>
          </div>
          <div class="grid gap-4 md:grid-cols-2">
            <BaseInput
              v-model="selectedArea.label"
              :label="t('ADMIN_MAPS.AREA_LABEL')"
              :hint="t('ADMIN_MAPS.AREA_LABEL_HINT')"
              :maxlength="120"
              required
            />
            <BaseSelect v-model="selectedArea.targetKind" :label="t('ADMIN_MAPS.TARGET')" :options="targetOptions" />
          </div>
          <PageLookup
            v-if="selectedArea.targetKind === 'page'"
            :label="t('ADMIN_MAPS.FIND_PAGE')"
            :selected-title="selectedArea.pageTitle"
            @select="choosePage"
          />
          <BaseInput
            v-else-if="selectedArea.targetKind === 'url'"
            :model-value="selectedArea.url ?? ''"
            :label="t('GENERAL.ADDRESS')"
            :placeholder="t('ADMIN_MAPS.URL_PLACEHOLDER')"
            :hint="t('ADMIN_MAPS.URL_HINT')"
            @update:model-value="setAreaUrl"
          />
          <div v-else class="flex flex-col gap-1.5">
            <p class="text-xs font-semibold tracking-wide text-aqua-300 uppercase">
              {{ t('ADMIN_MAPS.POPUP_CONTENT') }}
            </p>
            <ClientOnly>
              <RichTextEditor
                :key="selectedIndex ?? -1"
                :model-value="selectedContent"
                :label="t('ADMIN_MAPS.POPUP_CONTENT')"
                extended
                allows-upload
                @update:model-value="setAreaContent"
              />
            </ClientOnly>
          </div>
        </section>
      </div>

      <aside class="flex flex-col gap-5 self-start panel p-5">
        <BaseInput v-model="input.title" :label="t('GENERAL.TITLE')" :maxlength="120" required />
        <BaseInput v-model="input.slug" :label="t('ADMIN_MAPS.SLUG')" :hint="t('ADMIN_MAPS.SLUG_HINT')" />
        <BaseTextarea v-model="input.description" :label="t('GENERAL.DESCRIPTION')" :rows="3" :maxlength="600" />
        <BaseSelect v-model="input.status" :label="t('GENERAL.STATUS')" :options="statusOptions" />
        <ImageField
          v-model="input.teaserImage"
          :label="t('ADMIN_MAPS.TEASER_IMAGE')"
          :hint="t('ADMIN_MAPS.TEASER_IMAGE_HINT')"
        />
        <div v-if="input.areas.length" class="flex flex-col gap-1.5">
          <p class="text-xs font-semibold tracking-wide text-aqua-300 uppercase">{{ t('ADMIN_MAPS.AREAS') }}</p>
          <ul class="max-h-64 overflow-y-auto rounded-lg border border-aqua-500/20">
            <li v-for="(area, index) in input.areas" :key="index">
              <button
                type="button"
                class="flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-1.5 text-left text-sm transition"
                :class="
                  index === selectedIndex ? 'cosmo-bar font-semibold text-abyss-950' : 'text-aqua-200 hover:bg-white/5'
                "
                @click="selectedIndex = index"
              >
                <span class="truncate">{{ area.label }}</span>
                <span class="shrink-0 text-[0.65rem] opacity-70">{{
                  t(MAP_AREA_TARGET_LABEL_KEYS[area.targetKind])
                }}</span>
              </button>
            </li>
          </ul>
        </div>
        <FormActions :cancel-to="LIST_PATH" :is-busy="isBusy" :error-message="errorMessage" />
      </aside>
    </div>
  </form>
</template>
