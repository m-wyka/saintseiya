<script setup lang="ts">
import { AUDIT_ACTIONS, AUDIT_ENTITIES, auditActionLabelKey, auditEntityLabelKey } from '#shared/utils/audit';
import type { AuditAction, AuditChange } from '#shared/utils/audit';
import { userRoleLabelKey } from '#shared/utils/roles';
import type { UserRole } from '#shared/utils/roles';
import { routes } from '#shared/utils/routes';

definePageMeta({ layout: 'admin' });

interface LogEntry {
  id: number;
  actorId: number | null;
  actorName: string;
  actorRole: UserRole;
  action: AuditAction;
  entity: string;
  entityId: number | null;
  label: string | null;
  locale: string | null;
  changes: AuditChange[];
  createdAt: string;
}

const ACTION_CLASSES: Record<AuditAction, string> = {
  create: 'border-cosmo-500/50 text-cosmo-400',
  update: 'border-gold-300/50 text-gold-300',
  delete: 'border-danger/60 text-danger',
  sign_in: 'border-aqua-500/30 text-aqua-500',
  register: 'border-aqua-500/30 text-aqua-300',
};

const { t, te } = useI18n();

const entity = ref('');
const { rows, page, pageCount, total, search, filter, isLoading } = useAdminList<LogEntry>('logs', { entity });

const actionOptions = computed(() => [
  { value: '', label: t('ADMIN_LOGS.ALL_ACTIONS') },
  ...AUDIT_ACTIONS.map((action) => ({ value: action, label: t(auditActionLabelKey(action)) })),
]);
const entityOptions = computed(() => [
  { value: '', label: t('ADMIN_LOGS.ALL_ENTITIES') },
  ...AUDIT_ENTITIES.map((name) => ({ value: name, label: t(auditEntityLabelKey(name)) })),
]);

const entityLabel = (name: string) => (te(auditEntityLabelKey(name)) ? t(auditEntityLabelKey(name)) : name);

useSeoMeta({ title: () => t('ADMIN_NAV.LOGS') });
</script>

<template>
  <div>
    <AdminHeader
      :title="t('ADMIN_NAV.LOGS')"
      :subtitle="t('ADMIN_LOGS.ENTRY_COUNT', { count: formatNumber(total) }, total)"
    >
      <BaseInput
        v-model="search"
        type="search"
        :label="t('GENERAL.SEARCH')"
        :placeholder="t('ADMIN_LOGS.SEARCH_PLACEHOLDER')"
        hide-label
        class="w-56"
      />
      <BaseSelect v-model="filter" :label="t('ADMIN_LOGS.ACTION')" :options="actionOptions" hide-label class="w-44" />
      <BaseSelect v-model="entity" :label="t('ADMIN_LOGS.ENTITY')" :options="entityOptions" hide-label class="w-52" />
    </AdminHeader>

    <ol class="divide-y divide-aqua-500/10 panel" :class="{ 'opacity-60': isLoading }">
      <li v-for="entry in rows" :key="entry.id" class="px-4 py-3 text-sm text-aqua-200">
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
          <time :datetime="entry.createdAt" class="whitespace-nowrap text-aqua-500 tabular-nums">
            {{ formatDateTime(entry.createdAt) }}
          </time>
          <span>
            <NuxtLinkLocale
              v-if="entry.actorId"
              :to="routes.user(entry.actorId)"
              class="font-semibold text-gold-300 hover:text-cosmo-400"
            >
              {{ entry.actorName }}
            </NuxtLinkLocale>
            <span v-else class="font-semibold text-aqua-300">{{ entry.actorName }}</span>
            <span class="ml-1.5 text-xs text-aqua-500">{{ t(userRoleLabelKey(entry.actorRole)) }}</span>
          </span>
          <span
            class="rounded-full border px-2 py-0.5 text-[0.7rem] font-semibold tracking-wide whitespace-nowrap uppercase"
            :class="ACTION_CLASSES[entry.action]"
          >
            {{ t(auditActionLabelKey(entry.action)) }}
          </span>
          <span class="min-w-0">
            <span class="text-[0.7rem] tracking-wide text-aqua-500 uppercase">{{ entityLabel(entry.entity) }}</span>
            <span v-if="entry.entityId" class="ml-1 text-xs text-aqua-500 tabular-nums">#{{ entry.entityId }}</span>
            <span v-if="entry.label" class="ml-1.5 font-semibold wrap-anywhere">{{ entry.label }}</span>
          </span>
          <span v-if="entry.locale" class="rounded-sm bg-white/10 px-1.5 text-[0.7rem] font-semibold uppercase">
            {{ entry.locale }}
          </span>
        </div>

        <details v-if="entry.changes.length" class="mt-2">
          <summary class="cursor-pointer text-xs text-aqua-300 hover:text-gold-300">
            {{ t('ADMIN_LOGS.CHANGE_COUNT', { count: formatNumber(entry.changes.length) }, entry.changes.length) }}
          </summary>
          <dl class="mt-2 grid gap-2">
            <div v-for="change in entry.changes" :key="change.field" class="rounded-lg bg-black/30 px-3 py-2">
              <dt class="font-mono text-xs text-aqua-500">{{ change.field }}</dt>
              <dd class="mt-1 grid gap-1 text-xs wrap-anywhere whitespace-pre-wrap sm:grid-cols-2 sm:gap-3">
                <div>
                  <span class="mr-1.5 text-aqua-500">{{ t('ADMIN_LOGS.BEFORE') }}</span>
                  <del v-if="change.before !== null" class="text-danger no-underline">{{ change.before }}</del>
                  <template v-else>—</template>
                </div>
                <div>
                  <span class="mr-1.5 text-aqua-500">{{ t('ADMIN_LOGS.AFTER') }}</span>
                  <ins v-if="change.after !== null" class="text-cosmo-400 no-underline">{{ change.after }}</ins>
                  <template v-else>—</template>
                </div>
              </dd>
            </div>
          </dl>
        </details>
      </li>
      <li v-if="!rows.length" class="px-4 py-10 text-center text-sm text-aqua-500">{{ t('ADMIN_LOGS.EMPTY') }}</li>
    </ol>
    <PageStepper v-model="page" :page-count="pageCount" />
  </div>
</template>
