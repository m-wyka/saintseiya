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

const { t } = useI18n();
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
    toasts.success(t('ADMIN_IMAGES.UPLOADED', { count: formatNumber(files.length) }, files.length));
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
    toasts.success(t('ADMIN_IMAGES.ADDRESS_COPIED'));
  } catch {
    toasts.error(t('ADMIN_IMAGES.ADDRESS_COPY_FAILED'));
  }
};

useSeoMeta({ title: () => t('ADMIN_NAV.IMAGES') });
</script>

<template>
  <div>
    <AdminHeader
      :title="t('ADMIN_NAV.IMAGES')"
      :subtitle="t('ADMIN_IMAGES.IMAGE_COUNT', { count: formatNumber(total) }, total)"
    >
      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        class="sr-only"
        :aria-label="t('ADMIN_IMAGES.UPLOAD_FROM_DISK')"
        @change="upload"
      />
      <BaseButton :busy="isBusy" @click="fileInput?.click()">
        <AppIcon name="plus" />
        {{ t('ADMIN_IMAGES.UPLOAD') }}
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
            :alt="t('ADMIN_IMAGES.IMAGE_ALT', { width: media.width, height: media.height })"
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
              {{ t('ADMIN_IMAGES.COPY_ADDRESS') }}
            </BaseButton>
            <ConfirmButton @confirm="removeImage(media)" />
          </div>
        </div>
      </li>
    </ul>
    <EmptyState v-else :message="t('ADMIN_IMAGES.EMPTY')" />
    <PageStepper v-model="page" :page-count="pageCount" />
  </div>
</template>
