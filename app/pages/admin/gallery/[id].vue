<script setup lang="ts">
import { routes } from '#shared/utils/routes';

definePageMeta({ layout: 'admin' });

type MoveDirection = 'previous' | 'next';

interface AlbumPhoto {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
}

interface AlbumWithPhotos {
  album: { id: number; slug: string; title: string; coverImage: string | null };
  photos: AlbumPhoto[];
}

const ALBUMS_PATH = '/admin/galeria';
const PHOTOS_API = '/api/admin/gallery/photos';

const route = useRoute('admin-gallery-id');
const albumPhotosApi = `/api/admin/gallery/albums/${route.params.id}/photos`;
const toasts = useToastStore();
const upload = useApiAction();
const edit = useApiAction();
const fileInput = ref<HTMLInputElement | null>(null);
const editedPhoto = ref<AlbumPhoto | null>(null);

const { data, error, refresh } = await useFetch<AlbumWithPhotos>(albumPhotosApi);

if (error.value || !data.value) {
  throw createError({ statusCode: 404, statusMessage: 'Nie znaleziono albumu', fatal: true });
}

const photos = computed(() => data.value?.photos ?? []);

const isCover = (photo: AlbumPhoto) => data.value?.album.coverImage === photo.thumbnail;
const isFirst = (photo: AlbumPhoto) => photos.value[0]?.id === photo.id;
const isLast = (photo: AlbumPhoto) => photos.value.at(-1)?.id === photo.id;

const uploadSelected = async (event: Event) => {
  const files = [...((event.target as HTMLInputElement).files ?? [])];
  if (!files.length) {
    return;
  }
  const form = new FormData();
  files.forEach((file) => form.append('file', file));
  const wasUploaded = await upload.run(() => apiRequest(albumPhotosApi, { method: 'POST', body: form }));
  if (wasUploaded) {
    toasts.success(`Dodano: ${pluralize(files.length, 'zdjęcie', 'zdjęcia', 'zdjęć')}`);
  }
  if (fileInput.value) {
    fileInput.value.value = '';
  }
  await refresh();
};

const changeAlbum = async (request: () => Promise<unknown>, successMessage?: string) => {
  try {
    await request();
    if (successMessage) {
      toasts.success(successMessage);
    }
    await refresh();
  } catch (requestError) {
    toasts.error(apiErrorMessage(requestError));
  }
};

const move = (photo: AlbumPhoto, direction: MoveDirection) =>
  changeAlbum(() => apiRequest(`${PHOTOS_API}/${photo.id}/move`, { method: 'POST', body: { direction } }));

const setAsCover = (photo: AlbumPhoto) =>
  changeAlbum(() => apiRequest(`${PHOTOS_API}/${photo.id}/cover`, { method: 'POST' }), 'Ustawiono okładkę albumu');

const remove = (photo: AlbumPhoto) =>
  changeAlbum(() => apiRequest(`${PHOTOS_API}/${photo.id}`, { method: 'DELETE' }), 'Usunięto');

const saveEdited = async () => {
  const photo = editedPhoto.value;
  if (!photo) {
    return;
  }
  const wasSaved = await edit.run(() =>
    apiRequest(`${PHOTOS_API}/${photo.id}`, {
      method: 'PUT',
      body: { title: photo.title, description: photo.description },
    }),
  );
  if (wasSaved) {
    toasts.success('Zapisano');
    editedPhoto.value = null;
    await refresh();
  }
};

useSeoMeta({ title: () => `${data.value?.album.title ?? ''} – Galeria` });
</script>

<template>
  <div v-if="data">
    <AdminHeader :title="data.album.title" :subtitle="pluralize(photos.length, 'zdjęcie', 'zdjęcia', 'zdjęć')">
      <BaseButton :to="ALBUMS_PATH" variant="ghost">
        <AppIcon name="chevronLeft" />
        Albumy
      </BaseButton>
      <BaseButton :to="routes.album(data.album.slug)" variant="secondary">
        <AppIcon name="eye" />
        Zobacz album
      </BaseButton>
      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        class="sr-only"
        aria-label="Wgraj zdjęcia z dysku"
        @change="uploadSelected"
      />
      <BaseButton :busy="upload.isBusy.value" @click="fileInput?.click()">
        <AppIcon name="plus" />
        Wgraj zdjęcia
      </BaseButton>
    </AdminHeader>

    <p v-if="upload.errorMessage.value" class="mb-4 flex items-center gap-2 text-sm text-danger" role="alert">
      <AppIcon name="warning" />
      {{ upload.errorMessage.value }}
    </p>

    <ul v-if="photos.length" class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      <li v-for="photo in photos" :key="photo.id" class="flex flex-col overflow-hidden panel">
        <a :href="routes.photo(photo.id)" target="_blank" rel="noopener" class="relative block bg-black/40">
          <img
            :src="routes.media(photo.thumbnail)"
            :alt="photo.title || `Zdjęcie ${photo.id}`"
            class="aspect-square w-full object-contain"
            loading="lazy"
          />
          <span
            v-if="isCover(photo)"
            class="absolute top-2 left-2 rounded-full cosmo-bar px-2 py-0.5 text-[0.7rem] font-semibold text-abyss-950"
          >
            Okładka
          </span>
        </a>

        <form v-if="editedPhoto?.id === photo.id" class="flex flex-1 flex-col gap-3 p-3" @submit.prevent="saveEdited">
          <BaseInput v-model="editedPhoto.title" label="Tytuł" :maxlength="200" />
          <BaseTextarea v-model="editedPhoto.description" label="Opis" :rows="3" :maxlength="2000" />
          <p v-if="edit.errorMessage.value" class="text-xs text-danger" role="alert">{{ edit.errorMessage.value }}</p>
          <div class="mt-auto flex flex-wrap gap-1.5">
            <BaseButton type="submit" size="sm" :busy="edit.isBusy.value">
              <AppIcon name="check" />
              Zapisz
            </BaseButton>
            <BaseButton variant="ghost" size="sm" @click="editedPhoto = null">Anuluj</BaseButton>
          </div>
        </form>

        <div v-else class="flex flex-1 flex-col gap-2 p-3">
          <p class="text-sm font-semibold" :class="photo.title ? 'text-aqua-200' : 'text-aqua-500'">
            {{ photo.title || 'Bez tytułu' }}
          </p>
          <p v-if="photo.description" class="line-clamp-2 text-xs text-aqua-500">{{ photo.description }}</p>
          <div class="mt-auto flex flex-wrap gap-1.5">
            <BaseButton
              variant="ghost"
              size="sm"
              :disabled="isFirst(photo)"
              :aria-label="`Przesuń w lewo: ${photo.title || `zdjęcie ${photo.id}`}`"
              title="Przesuń w lewo"
              @click="move(photo, 'previous')"
            >
              <AppIcon name="chevronLeft" />
            </BaseButton>
            <BaseButton
              variant="ghost"
              size="sm"
              :disabled="isLast(photo)"
              :aria-label="`Przesuń w prawo: ${photo.title || `zdjęcie ${photo.id}`}`"
              title="Przesuń w prawo"
              @click="move(photo, 'next')"
            >
              <AppIcon name="chevronRight" />
            </BaseButton>
            <BaseButton v-if="!isCover(photo)" variant="ghost" size="sm" @click="setAsCover(photo)">
              <AppIcon name="star" />
              Ustaw jako okładkę
            </BaseButton>
            <BaseButton variant="ghost" size="sm" @click="editedPhoto = { ...photo }">
              <AppIcon name="edit" />
              Edytuj
            </BaseButton>
            <ConfirmButton @confirm="remove(photo)" />
          </div>
        </div>
      </li>
    </ul>
    <EmptyState v-else message="Ten album jest jeszcze pusty. Wgraj pierwsze zdjęcia z dysku." />
  </div>
</template>
