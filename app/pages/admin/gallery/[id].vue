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

const { t } = useI18n();
const routeId = useRouteParam('id');
const albumPhotosApi = `/api/admin/gallery/albums/${routeId.value}/photos`;
const toasts = useToastStore();
const upload = useApiAction();
const edit = useApiAction();
const fileInput = ref<HTMLInputElement | null>(null);
const editedPhoto = ref<AlbumPhoto | null>(null);

const { data, error, refresh } = await useFetch<AlbumWithPhotos>(albumPhotosApi);

if (error.value || !data.value) {
  throw createError({ statusCode: 404, statusMessage: t('ADMIN_GALLERY.ALBUM_NOT_FOUND'), fatal: true });
}

const photos = computed(() => data.value?.photos ?? []);

const photoCountLabel = (count: number) => t('ADMIN_GALLERY.PHOTO_COUNT', { count: formatNumber(count) }, count);
const photoNameOf = (photo: AlbumPhoto) => photo.title || t('ADMIN_GALLERY.PHOTO_FALLBACK', { id: photo.id });

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
    toasts.success(t('ADMIN_GALLERY.PHOTOS_ADDED', { photos: photoCountLabel(files.length) }));
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
  changeAlbum(() => apiRequest(`${PHOTOS_API}/${photo.id}/cover`, { method: 'POST' }), t('ADMIN_GALLERY.COVER_SET'));

const remove = (photo: AlbumPhoto) =>
  changeAlbum(() => apiRequest(`${PHOTOS_API}/${photo.id}`, { method: 'DELETE' }), t('GENERAL.DELETED'));

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
    toasts.success(t('GENERAL.SAVED'));
    editedPhoto.value = null;
    await refresh();
  }
};

useSeoMeta({ title: () => t('ADMIN_GALLERY.SEO_TITLE', { title: data.value?.album.title ?? '' }) });
</script>

<template>
  <div v-if="data">
    <AdminHeader :title="data.album.title" :subtitle="photoCountLabel(photos.length)">
      <BaseButton :to="ALBUMS_PATH" variant="ghost">
        <AppIcon name="chevronLeft" />
        {{ t('ADMIN_GALLERY.ALBUMS') }}
      </BaseButton>
      <BaseButton :to="routes.album(data.album.slug)" variant="secondary">
        <AppIcon name="eye" />
        {{ t('ADMIN_GALLERY.VIEW_ALBUM') }}
      </BaseButton>
      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        class="sr-only"
        :aria-label="t('ADMIN_GALLERY.UPLOAD_FROM_DISK')"
        @change="uploadSelected"
      />
      <BaseButton :busy="upload.isBusy.value" @click="fileInput?.click()">
        <AppIcon name="plus" />
        {{ t('ADMIN_GALLERY.UPLOAD_PHOTOS') }}
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
            :alt="photo.title || t('ADMIN_GALLERY.PHOTO_ALT', { id: photo.id })"
            class="aspect-square w-full object-contain"
            loading="lazy"
          />
          <span
            v-if="isCover(photo)"
            class="absolute top-2 left-2 rounded-full cosmo-bar px-2 py-0.5 text-[0.7rem] font-semibold text-abyss-950"
          >
            {{ t('ADMIN_GALLERY.COVER') }}
          </span>
        </a>

        <form v-if="editedPhoto?.id === photo.id" class="flex flex-1 flex-col gap-3 p-3" @submit.prevent="saveEdited">
          <BaseInput v-model="editedPhoto.title" :label="t('GENERAL.TITLE')" :maxlength="200" />
          <BaseTextarea
            v-model="editedPhoto.description"
            :label="t('GENERAL.DESCRIPTION')"
            :rows="3"
            :maxlength="2000"
          />
          <p v-if="edit.errorMessage.value" class="text-xs text-danger" role="alert">{{ edit.errorMessage.value }}</p>
          <div class="mt-auto flex flex-wrap gap-1.5">
            <BaseButton type="submit" size="sm" :busy="edit.isBusy.value">
              <AppIcon name="check" />
              {{ t('GENERAL.SAVE') }}
            </BaseButton>
            <BaseButton variant="ghost" size="sm" @click="editedPhoto = null">{{ t('GENERAL.CANCEL') }}</BaseButton>
          </div>
        </form>

        <div v-else class="flex flex-1 flex-col gap-2 p-3">
          <p class="text-sm font-semibold" :class="photo.title ? 'text-aqua-200' : 'text-aqua-500'">
            {{ photo.title || t('ADMIN_GALLERY.UNTITLED') }}
          </p>
          <p v-if="photo.description" class="line-clamp-2 text-xs text-aqua-500">{{ photo.description }}</p>
          <div class="mt-auto flex flex-wrap gap-1.5">
            <BaseButton
              variant="ghost"
              size="sm"
              :disabled="isFirst(photo)"
              :aria-label="t('ADMIN_GALLERY.MOVE_LEFT_LABEL', { name: photoNameOf(photo) })"
              :title="t('ADMIN_GALLERY.MOVE_LEFT')"
              @click="move(photo, 'previous')"
            >
              <AppIcon name="chevronLeft" />
            </BaseButton>
            <BaseButton
              variant="ghost"
              size="sm"
              :disabled="isLast(photo)"
              :aria-label="t('ADMIN_GALLERY.MOVE_RIGHT_LABEL', { name: photoNameOf(photo) })"
              :title="t('ADMIN_GALLERY.MOVE_RIGHT')"
              @click="move(photo, 'next')"
            >
              <AppIcon name="chevronRight" />
            </BaseButton>
            <BaseButton v-if="!isCover(photo)" variant="ghost" size="sm" @click="setAsCover(photo)">
              <AppIcon name="star" />
              {{ t('ADMIN_GALLERY.SET_AS_COVER') }}
            </BaseButton>
            <BaseButton variant="ghost" size="sm" @click="editedPhoto = { ...photo }">
              <AppIcon name="edit" />
              {{ t('GENERAL.EDIT') }}
            </BaseButton>
            <ConfirmButton :question="t('CONFIRM.DELETE_PHOTO')" @confirm="remove(photo)" />
          </div>
        </div>
      </li>
    </ul>
    <EmptyState v-else :message="t('ADMIN_GALLERY.EMPTY_ALBUM')" />
  </div>
</template>
