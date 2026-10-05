<script setup lang="ts">
import { MAP_AREA_TARGETS } from '#shared/utils/content';
import type { ContentStatus } from '#shared/utils/content';
import { routes } from '#shared/utils/routes';
import { MAP_AREA_TARGET_LABELS } from '~/utils/mapAreas';
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
const STATUS_OPTIONS: { value: ContentStatus; label: string }[] = [
  { value: 'draft', label: 'Szkic' },
  { value: 'published', label: 'Opublikowana' },
];
const TARGET_OPTIONS = MAP_AREA_TARGETS.map((value) => ({ value, label: MAP_AREA_TARGET_LABELS[value] }));

const route = useRoute('admin-maps-id');
const { input, isNew, isBusy, errorMessage, save } = await useAdminForm<MapInput>({
  resource: 'maps',
  recordId: route.params.id,
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

useSeoMeta({ title: isNew ? 'Nowa mapa' : 'Edycja mapy' });
</script>

<template>
  <form @submit.self.prevent="save">
    <AdminHeader
      :title="isNew ? 'Nowa mapa' : 'Edycja mapy'"
      :subtitle="input.image ? `Obszarów: ${input.areas.length}` : undefined"
    />

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div class="flex min-w-0 flex-col gap-4">
        <div class="flex flex-wrap items-center gap-3 panel p-4">
          <input
            ref="imageInput"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            class="sr-only"
            aria-label="Obraz mapy"
            @change="uploadMapImage"
          />
          <BaseButton variant="secondary" :busy="imageUpload.isBusy.value" @click="imageInput?.click()">
            <AppIcon name="image" />
            {{ input.image ? 'Zmień obraz mapy' : 'Wgraj obraz mapy' }}
          </BaseButton>
          <p class="text-xs text-aqua-500">
            {{
              input.image
                ? `${input.imageWidth}×${input.imageHeight} px. Przeciągnij po obrazie, aby narysować obszar; kliknij obszar, aby go edytować.`
                : 'Zacznij od wgrania obrazu — potem narysujesz na nim klikalne obszary.'
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
            <h2 class="heading-display text-lg text-gold-300">Wybrany obszar</h2>
            <BaseButton variant="danger" size="sm" @click="removeSelectedArea">
              <AppIcon name="trash" />
              Usuń obszar
            </BaseButton>
          </div>
          <div class="grid gap-4 md:grid-cols-2">
            <BaseInput
              v-model="selectedArea.label"
              label="Etykieta"
              hint="Pokazuje się po najechaniu na obszar"
              :maxlength="120"
              required
            />
            <BaseSelect v-model="selectedArea.targetKind" label="Dokąd prowadzi" :options="TARGET_OPTIONS" />
          </div>
          <PageLookup
            v-if="selectedArea.targetKind === 'page'"
            label="Szukaj podstrony"
            :selected-title="selectedArea.pageTitle"
            @select="choosePage"
          />
          <BaseInput
            v-else-if="selectedArea.targetKind === 'url'"
            :model-value="selectedArea.url ?? ''"
            label="Adres"
            placeholder="/forum albo https://…"
            hint="Adres wewnętrzny zaczyna się od /, zewnętrzny od https://"
            @update:model-value="setAreaUrl"
          />
          <div v-else class="flex flex-col gap-1.5">
            <p class="text-xs font-semibold tracking-wide text-aqua-300 uppercase">Treść okienka</p>
            <ClientOnly>
              <RichTextEditor
                :key="selectedIndex ?? -1"
                :model-value="selectedContent"
                label="Treść okienka"
                extended
                allows-upload
                @update:model-value="setAreaContent"
              />
            </ClientOnly>
          </div>
        </section>
      </div>

      <aside class="flex flex-col gap-5 self-start panel p-5">
        <BaseInput v-model="input.title" label="Tytuł" :maxlength="120" required />
        <BaseInput v-model="input.slug" label="Adres (slug)" hint="Puste pole = adres utworzy się z tytułu" />
        <BaseTextarea v-model="input.description" label="Opis" :rows="3" :maxlength="600" />
        <BaseSelect v-model="input.status" label="Status" :options="STATUS_OPTIONS" />
        <ImageField
          v-model="input.teaserImage"
          label="Grafika zapowiedzi"
          hint="Mały kafel pokazywany w stopce strony"
        />
        <div v-if="input.areas.length" class="flex flex-col gap-1.5">
          <p class="text-xs font-semibold tracking-wide text-aqua-300 uppercase">Obszary</p>
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
                <span class="shrink-0 text-[0.65rem] opacity-70">{{ MAP_AREA_TARGET_LABELS[area.targetKind] }}</span>
              </button>
            </li>
          </ul>
        </div>
        <FormActions :cancel-to="LIST_PATH" :is-busy="isBusy" :error-message="errorMessage" />
      </aside>
    </div>
  </form>
</template>
