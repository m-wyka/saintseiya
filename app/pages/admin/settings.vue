<script setup lang="ts">
import { withMovedItem } from '#shared/utils/ordering';
import type { MoveDirection } from '#shared/utils/ordering';

definePageMeta({ layout: 'admin' });

interface NewsCenterTab {
  title: string;
  bodyHtml: string;
}

const MAX_TABS = 8;

const { t } = useI18n();

const tabs = ref(await $fetch<NewsCenterTab[]>('/api/admin/settings/news-center'));
const openedIndex = ref<number | null>(null);
const toasts = useToastStore();
const { isBusy, errorMessage, run } = useApiAction();

const addTab = () => {
  tabs.value = [...tabs.value, { title: t('ADMIN_SETTINGS.NEW_TAB_TITLE'), bodyHtml: '' }];
  openedIndex.value = tabs.value.length - 1;
};

const removeTab = (index: number) => {
  tabs.value = tabs.value.filter((_, position) => position !== index);
  openedIndex.value = null;
};

const moveTab = (index: number, direction: MoveDirection) => {
  tabs.value = withMovedItem(tabs.value, index, direction);
  openedIndex.value = null;
};

const save = async () => {
  const wasSaved = await run(() =>
    apiRequest('/api/admin/settings/news-center', { method: 'PUT', body: { tabs: tabs.value } }),
  );
  if (wasSaved) {
    toasts.success(t('ADMIN_SETTINGS.SAVED'));
  }
};

useSeoMeta({ title: () => t('ADMIN_NAV.SETTINGS') });
</script>

<template>
  <form @submit.self.prevent="save">
    <AdminHeader :title="t('ADMIN_NAV.SETTINGS')" :subtitle="t('ADMIN_SETTINGS.SUBTITLE')">
      <BaseButton variant="secondary" :disabled="tabs.length >= MAX_TABS" @click="addTab">
        <AppIcon name="plus" />
        {{ t('ADMIN_SETTINGS.ADD_TAB') }}
      </BaseButton>
      <BaseButton type="submit" :busy="isBusy">
        <AppIcon name="check" />
        {{ t('GENERAL.SAVE') }}
      </BaseButton>
    </AdminHeader>

    <p v-if="errorMessage" class="mb-4 flex items-center gap-2 text-sm text-danger" role="alert">
      <AppIcon name="warning" />
      {{ errorMessage }}
    </p>

    <ol v-if="tabs.length" class="flex flex-col gap-3">
      <li v-for="(tab, index) in tabs" :key="index" class="panel">
        <div class="flex flex-wrap items-center gap-2 px-4 py-3">
          <span
            class="grid size-7 shrink-0 place-items-center rounded-full bg-black/40 text-xs font-semibold text-cosmo-400"
            >{{ index + 1 }}</span
          >
          <p class="min-w-0 flex-1 truncate font-semibold text-gold-300">{{ tab.title }}</p>
          <MoveButtons
            :item-label="tab.title"
            :is-first="index === 0"
            :is-last="index === tabs.length - 1"
            @move="moveTab(index, $event)"
          />
          <BaseButton variant="ghost" size="sm" @click="openedIndex = openedIndex === index ? null : index">
            <AppIcon name="edit" />
            {{ openedIndex === index ? t('ADMIN_SETTINGS.COLLAPSE') : t('GENERAL.EDIT') }}
          </BaseButton>
          <ConfirmButton @confirm="removeTab(index)" />
        </div>
        <div v-if="openedIndex === index" class="flex flex-col gap-4 border-t border-aqua-500/15 p-4">
          <BaseInput v-model="tab.title" :label="t('ADMIN_SETTINGS.TAB_TITLE')" :maxlength="40" required />
          <div class="flex flex-col gap-1.5">
            <p class="text-xs font-semibold tracking-wide text-aqua-300 uppercase">{{ t('GENERAL.CONTENT') }}</p>
            <ClientOnly
              ><RichTextEditor v-model="tab.bodyHtml" :label="t('ADMIN_SETTINGS.TAB_CONTENT')" extended allows-upload
            /></ClientOnly>
          </div>
        </div>
      </li>
    </ol>
    <p v-else class="panel px-6 py-10 text-center text-sm text-aqua-300">
      {{ t('ADMIN_SETTINGS.EMPTY') }}
    </p>
  </form>
</template>
