<script setup lang="ts">
import { MISSING_IMAGE_TITLE_KEY } from '#shared/utils/content';
import { DEFAULT_LOCALE } from '#shared/utils/locales';
import { MEDIA_BASE_URL } from '#shared/utils/routes';

const props = defineProps<{ html: string }>();

const NON_PAGE_PREFIXES = [MEDIA_BASE_URL, '/api', '/auth', '/theme', '/legacy', '/forum/post'];

const { t, locale } = useI18n();
const localePath = useLocalePath();
const container = ref<HTMLElement | null>(null);
const localizedHtml = computed(() =>
  props.html.replaceAll(
    `<strong>${MISSING_IMAGE_TITLE_KEY}</strong>`,
    `<strong>${t(MISSING_IMAGE_TITLE_KEY)}</strong>`,
  ),
);
useMissingImagePlaceholders(container, localizedHtml);

const isPageAddress = (address: string): boolean =>
  address.startsWith('/') &&
  !address.startsWith('//') &&
  !NON_PAGE_PREFIXES.some((prefix) => address === prefix || address.startsWith(`${prefix}/`));

const openInCurrentLanguage = (event: MouseEvent) => {
  const link = event.target instanceof Element ? event.target.closest('a') : null;
  const address = link?.getAttribute('href') ?? '';
  const opensElsewhere = event.ctrlKey || event.metaKey || event.shiftKey || link?.target === '_blank';
  if (locale.value === DEFAULT_LOCALE || opensElsewhere || !isPageAddress(address)) {
    return;
  }
  event.preventDefault();
  navigateTo(localePath(address));
};
</script>

<template>
  <div ref="container" class="rich-content" @click="openInCurrentLanguage" v-html="localizedHtml" />
</template>
