<script setup lang="ts">
import type { CommentTarget } from '#shared/utils/content';

const props = defineProps<{ targetKind: CommentTarget; targetId: number; enabled: boolean }>();

const page = ref(1);
const { data: comments, refresh } = await useFetch('/api/comments', {
  query: computed(() => ({ targetKind: props.targetKind, targetId: props.targetId, page: page.value })),
});

const showsSection = computed(() => props.enabled || Boolean(comments.value?.total));
const goToLastPage = async () => {
  await refresh();
  page.value = comments.value?.pageCount ?? 1;
};
</script>

<template>
  <section v-if="showsSection && comments" class="mt-10" aria-labelledby="comments-heading">
    <SectionHeading id="comments-heading" :title="`Komentarze (${formatNumber(comments.total)})`" />
    <ol v-if="comments.items.length" class="flex flex-col gap-3">
      <li v-for="comment in comments.items" :key="comment.id" class="reveal panel px-5 py-4">
        <p class="mb-2 flex flex-wrap items-baseline justify-between gap-2 text-xs text-aqua-500">
          <AuthorName :author="comment.author" class="text-sm" />
          <time :datetime="comment.createdAt">{{ formatDateTime(comment.createdAt) }}</time>
        </p>
        <RichContent :html="comment.bodyHtml" />
      </li>
    </ol>
    <EmptyState v-else message="Nikt jeszcze nie skomentował. Bądź pierwszy!" />
    <div v-if="comments.pageCount > 1" class="mt-4 flex justify-center gap-2">
      <BaseButton variant="secondary" size="sm" :disabled="page <= 1" @click="page -= 1">
        <AppIcon name="chevronLeft" />
        Wcześniejsze
      </BaseButton>
      <span class="self-center text-xs text-aqua-500">{{ page }} / {{ comments.pageCount }}</span>
      <BaseButton variant="secondary" size="sm" :disabled="page >= comments.pageCount" @click="page += 1">
        Późniejsze
        <AppIcon name="chevronRight" />
      </BaseButton>
    </div>
    <CommentForm v-if="enabled" :target-kind="targetKind" :target-id="targetId" class="mt-6" @posted="goToLastPage" />
  </section>
</template>
