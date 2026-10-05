<script setup lang="ts">
import type { MoveDirection } from '#shared/utils/ordering';

definePageMeta({ layout: 'admin' });

interface SectionRow {
  id: number;
  title: string;
}

interface LinkRow {
  id: number;
  sectionId: number;
  groupTitle: string | null;
  label: string;
  url: string;
}

const NEW_SECTION_FORM = 'new-section';

const { t } = useI18n();

const sectionFormOf = (sectionId: number) => `section-${sectionId}`;
const newLinkFormOf = (sectionId: number) => `new-link-${sectionId}`;
const linkFormOf = (linkId: number) => `link-${linkId}`;

const {
  rows: sections,
  refresh: refreshSections,
  remove: removeSectionRow,
} = useAdminList<SectionRow>('navigation-sections');
const { rows: links, refresh: refreshLinks, remove: removeLink } = useAdminList<LinkRow>('navigation-links');
const toasts = useToastStore();
const openForm = ref<string | null>(null);

const sectionsWithLinks = computed(() =>
  sections.value.map((section) => ({
    ...section,
    links: links.value.filter((link) => link.sectionId === section.id),
  })),
);
const sectionOptions = computed(() => sections.value.map(({ id, title }) => ({ value: id, label: title })));

const refreshNavigation = () => Promise.all([refreshSections(), refreshLinks()]);

const closeForm = () => {
  openForm.value = null;
};

const showSaved = async () => {
  closeForm();
  await refreshNavigation();
};

const removeSection = async (sectionId: number) => {
  await removeSectionRow(sectionId);
  await refreshLinks();
};

const move = async (kind: 'sections' | 'links', id: number, direction: MoveDirection) => {
  try {
    await apiRequest(`/api/admin/navigation/${kind}/${id}/move`, { method: 'POST', body: { direction } });
    await refreshNavigation();
  } catch (error) {
    toasts.error(apiErrorMessage(error));
  }
};

useSeoMeta({ title: () => t('ADMIN_NAV.NAVIGATION') });
</script>

<template>
  <div>
    <AdminHeader :title="t('ADMIN_NAV.NAVIGATION')" :subtitle="t('ADMIN_NAVIGATION.SUBTITLE')">
      <BaseButton @click="openForm = NEW_SECTION_FORM">
        <AppIcon name="plus" />
        {{ t('ADMIN_NAVIGATION.ADD_SECTION') }}
      </BaseButton>
    </AdminHeader>

    <div v-if="openForm === NEW_SECTION_FORM" class="mb-6 animate-rise panel p-5">
      <h2 class="mb-4 heading-display text-lg text-gold-300">{{ t('ADMIN_NAVIGATION.ADD_SECTION') }}</h2>
      <NavigationSectionForm :section="null" @saved="showSaved" @cancel="closeForm" />
    </div>

    <section
      v-for="(section, sectionIndex) in sectionsWithLinks"
      :key="section.id"
      class="mb-5 overflow-hidden panel"
      :aria-label="section.title"
    >
      <header class="border-b border-aqua-500/15 bg-black/30 px-4 py-3">
        <NavigationSectionForm
          v-if="openForm === sectionFormOf(section.id)"
          :section="section"
          @saved="showSaved"
          @cancel="closeForm"
        />
        <div v-else class="flex flex-wrap items-center justify-between gap-2">
          <h2 class="heading-display text-lg text-gold-300">{{ section.title }}</h2>
          <div class="flex flex-wrap items-center gap-1.5">
            <MoveButtons
              :item-label="section.title"
              :is-first="sectionIndex === 0"
              :is-last="sectionIndex === sectionsWithLinks.length - 1"
              @move="move('sections', section.id, $event)"
            />
            <BaseButton variant="ghost" size="sm" @click="openForm = newLinkFormOf(section.id)">
              <AppIcon name="plus" />
              {{ t('ADMIN_NAVIGATION.ADD_LINK') }}
            </BaseButton>
            <BaseButton variant="ghost" size="sm" @click="openForm = sectionFormOf(section.id)">
              <AppIcon name="edit" />
              {{ t('GENERAL.EDIT') }}
            </BaseButton>
            <ConfirmButton
              :confirm-label="t('ADMIN_NAVIGATION.CONFIRM_REMOVE_SECTION')"
              @confirm="removeSection(section.id)"
            />
          </div>
        </div>
      </header>

      <ul class="divide-y divide-aqua-500/10">
        <li v-for="(link, linkIndex) in section.links" :key="link.id">
          <NavigationLinkForm
            v-if="openForm === linkFormOf(link.id)"
            class="p-4"
            :link="link"
            :section-options="sectionOptions"
            @saved="showSaved"
            @cancel="closeForm"
          />
          <div
            v-else
            class="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 transition duration-150 hover:bg-white/5"
          >
            <div class="min-w-0 flex-1 text-sm">
              <p class="text-aqua-200">
                <span
                  v-if="link.groupTitle"
                  class="mr-1.5 rounded-sm bg-white/10 px-1.5 py-0.5 text-[0.65rem] font-semibold tracking-wide text-gold-200 uppercase"
                >
                  {{ link.groupTitle }}
                </span>
                {{ link.label }}
              </p>
              <p class="truncate text-xs text-aqua-500">{{ link.url }}</p>
            </div>
            <div class="flex items-center gap-1.5">
              <MoveButtons
                :item-label="link.label"
                :is-first="linkIndex === 0"
                :is-last="linkIndex === section.links.length - 1"
                @move="move('links', link.id, $event)"
              />
              <BaseButton variant="ghost" size="sm" @click="openForm = linkFormOf(link.id)">
                <AppIcon name="edit" />
                {{ t('GENERAL.EDIT') }}
              </BaseButton>
              <ConfirmButton @confirm="removeLink(link.id)" />
            </div>
          </div>
        </li>
        <li v-if="openForm === newLinkFormOf(section.id)" class="p-4">
          <NavigationLinkForm
            :link="{ id: null, sectionId: section.id, groupTitle: null, label: '', url: '' }"
            :section-options="sectionOptions"
            @saved="showSaved"
            @cancel="closeForm"
          />
        </li>
      </ul>
      <p
        v-if="!section.links.length && openForm !== newLinkFormOf(section.id)"
        class="px-4 py-6 text-center text-sm text-aqua-500"
      >
        {{ t('ADMIN_NAVIGATION.SECTION_EMPTY') }}
      </p>
    </section>

    <p v-if="!sectionsWithLinks.length" class="panel px-4 py-10 text-center text-sm text-aqua-500">
      {{ t('ADMIN_NAVIGATION.EMPTY') }}
    </p>
  </div>
</template>
