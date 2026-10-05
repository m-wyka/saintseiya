<script setup lang="ts">
import { faqItemAnchor } from '#shared/utils/routes';

const { t } = useI18n();
const route = useRoute();
const { data: categories } = await useFetch('/api/faq');

// The server never sees the hash, so the linked question opens once the page runs in the browser.
const linkedAnchor = ref('');
const followHash = () => {
  linkedAnchor.value = route.hash.slice(1);
};

onMounted(followHash);
watch(() => route.hash, followHash);

useSeoMeta({ title: () => t('FAQ.TITLE') });
</script>

<template>
  <div>
    <PageHeading :title="t('FAQ.TITLE')" :subtitle="t('FAQ.SUBTITLE')" />
    <div v-if="categories?.length" class="flex flex-col gap-8">
      <section v-for="category in categories" :key="category.id">
        <SectionHeading :title="category.name" />
        <div class="flex flex-col gap-2">
          <details
            v-for="(item, index) in category.items"
            :id="faqItemAnchor(item.id)"
            :key="item.id"
            class="faq-item scroll-mt-24 panel"
            :open="linkedAnchor === faqItemAnchor(item.id)"
          >
            <summary>
              <span class="text-cosmo-500">{{ index + 1 }}.</span>
              <span class="flex-1">{{ item.title }}</span>
            </summary>
            <div class="px-4 pb-4">
              <RichContent :html="item.descriptionHtml" />
            </div>
          </details>
        </div>
      </section>
    </div>
    <p v-else class="panel p-6 text-sm text-aqua-300">{{ t('FAQ.EMPTY') }}</p>
  </div>
</template>
