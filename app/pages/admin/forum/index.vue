<script setup lang="ts">
import { FORUM_ADMIN_TABS } from '~/utils/adminTabs';
import { routes } from '#shared/utils/routes';
import type { CrudColumn, CrudField } from '~/utils/crud';

definePageMeta({ layout: 'admin' });

interface ForumRow {
  slug: string;
  isStaffOnly: boolean;
}

const { t } = useI18n();

const columns = computed<CrudColumn[]>(() => [
  { key: 'name', label: t('GENERAL.NAME') },
  { key: 'categoryName', label: t('GENERAL.CATEGORY') },
  { key: 'slug', label: t('GENERAL.ADDRESS') },
  { key: 'isStaffOnly', label: t('ADMIN_FORUM.ACCESS') },
  { key: 'sortOrder', label: t('GENERAL.SORT_ORDER'), alignsRight: true },
  { key: 'threadCount', label: t('ADMIN_FORUM.THREADS_COLUMN'), alignsRight: true },
  { key: 'postCount', label: t('ADMIN_FORUM.POSTS_COLUMN'), alignsRight: true },
]);

const categories = await $fetch<{ id: number; name: string }[]>('/api/admin/forum-categories');

const fields = computed<CrudField[]>(() => [
  { key: 'name', label: t('GENERAL.NAME'), kind: 'text', required: true },
  {
    key: 'categoryId',
    label: t('GENERAL.CATEGORY'),
    kind: 'select',
    required: true,
    options: categories.map(({ id, name }) => ({ value: id, label: name })),
  },
  { key: 'slug', label: t('ADMIN_FORUM.SLUG'), kind: 'text', hint: t('ADMIN_FORUM.SLUG_HINT') },
  { key: 'sortOrder', label: t('GENERAL.SORT_ORDER'), kind: 'number', hint: t('ADMIN_FORUM.SORT_ORDER_HINT') },
  { key: 'description', label: t('GENERAL.DESCRIPTION'), kind: 'textarea' },
  {
    key: 'isStaffOnly',
    label: t('ADMIN_FORUM.STAFF_ONLY'),
    kind: 'checkbox',
    hint: t('ADMIN_FORUM.STAFF_ONLY_HINT'),
  },
]);
const EMPTY_INPUT = {
  name: '',
  categoryId: categories[0]?.id ?? 0,
  slug: '',
  sortOrder: 0,
  description: '',
  isStaffOnly: false,
};

const forumOf = (row: object) => row as ForumRow;
</script>

<template>
  <div>
    <AdminTabs :label="t('ADMIN_FORUM.STRUCTURE')" :tabs="FORUM_ADMIN_TABS" />
    <SimpleCrud
      resource="forums"
      :title="t('ADMIN_FORUM.SECTIONS_TITLE')"
      :subtitle="t('ADMIN_FORUM.SECTIONS_SUBTITLE')"
      :add-label="t('ADMIN_FORUM.ADD_SECTION')"
      :columns="columns"
      :fields="fields"
      :empty-input="EMPTY_INPUT"
    >
      <template #cell-isStaffOnly="{ row }">
        <StateBadge v-if="forumOf(row).isStaffOnly" :label="t('ADMIN_FORUM.BADGE_STAFF')" icon="lock" tone="muted" />
        <StateBadge v-else :label="t('ADMIN_FORUM.BADGE_PUBLIC')" icon="eye" tone="positive" />
      </template>
      <template #row-actions="{ row }">
        <BaseButton :to="routes.forum(forumOf(row).slug)" variant="ghost" size="sm">
          <AppIcon name="eye" />
          {{ t('ADMIN_FORUM.VIEW') }}
        </BaseButton>
      </template>
    </SimpleCrud>
  </div>
</template>
