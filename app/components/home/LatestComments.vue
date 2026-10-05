<script setup lang="ts">
import type { InternalApi } from 'nitropack';

type CommentSummary = InternalApi['/api/home']['get']['latestComments'][number];

defineProps<{ comments: CommentSummary[] }>();
</script>

<template>
  <section v-if="comments.length" aria-labelledby="latest-comments-heading">
    <SectionHeading id="latest-comments-heading" title="Rycerze komentują" />
    <ul class="flex snap-x snap-mandatory scrollbar-thin gap-4 overflow-x-auto pb-3">
      <li v-for="comment in comments" :key="comment.id" class="w-72 shrink-0 snap-start">
        <NuxtLink
          :to="comment.target.url"
          class="flex h-full flex-col gap-2 panel p-4 text-sm transition duration-300 ease-cosmo hover:-translate-y-1 hover:border-cosmo-500/50"
        >
          <p class="line-clamp-3 flex-1 text-aqua-200">„{{ comment.excerpt }}”</p>
          <p class="text-xs text-aqua-500">
            <AuthorName :author="comment.author" :linked="false" />
            <span class="mt-0.5 block truncate text-cosmo-400">{{ comment.target.title }}</span>
          </p>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>
