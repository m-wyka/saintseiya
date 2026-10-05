<script setup lang="ts">
import { routes } from '#shared/utils/routes';

definePageMeta({ layout: 'admin' });

interface MediaImage {
  id: number;
  image: string;
  thumbnail: string;
  width: number;
  height: number;
  createdAt: string;
}

const { rows, page, pageCount, total, isLoading, refresh, remove } = useAdminList<MediaImage>('media');
const { isBusy, errorMessage, run } = useApiAction();
const toasts = useToastStore();
const siteOrigin = useRequestURL().origin;
const fileInput = ref<HTMLInputElement | null>(null);

const addressOf = (media: MediaImage) => `${siteOrigin}${routes.media(media.image)}`;

const upload = async (event: Event) => {
  const files = [...((event.target as HTMLInputElement).files ?? [])];
  if (!files.length) {
    return;
  }
  const form = new FormData();
  files.forEach((file) => form.append('file', file));
  const wasUploaded = await run(() => apiRequest('/api/admin/media', { method: 'POST', body: form }));
  if (wasUploaded) {
    toasts.success(`Wgrano: ${pluralize(files.length, 'obrazek', 'obrazki', 'obrazków')}`);
  }
  if (fileInput.value) {
    fileInput.value.value = '';
  }
  page.value = 1;
  await refresh();
};

const removeImage = async (media: MediaImage) => {
  errorMessage.value = '';
  await remove(media.id);
};

const copyAddress = async (media: MediaImage) => {
  errorMessage.value = '';
  try {
    await navigator.clipboard.writeText(addressOf(media));
    toasts.success('Adres skopiowany do schowka');
  } catch {
    toasts.error('Nie udało się skopiować adresu');
  }
};

useSeoMeta({ title: 'Obrazki' });
</script>

<template>
  <div>
    <AdminHeader title="Obrazki" :subtitle="pluralize(total, 'obrazek', 'obrazki', 'obrazków')">
      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        class="sr-only"
        aria-label="Wgraj obrazki z dysku"
        @change="upload"
      />
      <BaseButton :busy="isBusy" @click="fileInput?.click()">
        <AppIcon name="plus" />
        Wgraj obrazki
      </BaseButton>
    </AdminHeader>

    <p v-if="errorMessage" class="mb-4 flex items-center gap-2 text-sm text-danger" role="alert">
      <AppIcon name="warning" />
      {{ errorMessage }}
    </p>

    <ul
      v-if="rows.length"
      class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
      :class="{ 'opacity-60': isLoading }"
    >
      <li v-for="media in rows" :key="media.id" class="flex flex-col overflow-hidden panel">
        <a :href="routes.media(media.image)" target="_blank" rel="noopener" class="block bg-black/40">
          <img
            :src="routes.media(media.thumbnail)"
            :alt="`Obrazek ${media.width}×${media.height}`"
            class="aspect-square w-full object-contain"
            loading="lazy"
          />
        </a>
        <div class="flex flex-1 flex-col gap-2 p-3">
          <p class="text-xs text-aqua-500">
            {{ media.width }}×{{ media.height }} px
            <time :datetime="media.createdAt" class="block">{{ formatLongDate(media.createdAt) }}</time>
          </p>
          <div class="mt-auto flex flex-wrap gap-1.5">
            <BaseButton variant="secondary" size="sm" @click="copyAddress(media)">
              <AppIcon name="link" />
              Kopiuj adres
            </BaseButton>
            <ConfirmButton @confirm="removeImage(media)" />
          </div>
        </div>
      </li>
    </ul>
    <EmptyState v-else message="Nie ma jeszcze żadnych obrazków. Wgraj pierwsze z dysku." />
    <PageStepper v-model="page" :page-count="pageCount" />
  </div>
</template>
