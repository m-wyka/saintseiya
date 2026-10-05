<script setup lang="ts">
import type { InternalApi } from 'nitropack';
import { GHOST_USER_CAPTION } from '#shared/utils/content';
import { routes } from '#shared/utils/routes';

type Post = InternalApi['/api/forum/threads/:id']['get']['posts']['items'][number];

const props = defineProps<{ post: Post; position: number; canEdit?: boolean; canDelete?: boolean }>();
const emit = defineEmits<{ changed: [] }>();

const isEditing = ref(false);
const moderate = useModerationAction();

const initialOf = (name: string) => name.trim().charAt(0).toLocaleUpperCase('pl');

const onEdited = () => {
  isEditing.value = false;
  emit('changed');
};

const removePost = async () => {
  const wasRemoved = await moderate(
    () => apiRequest(`/api/forum/posts/${props.post.id}`, { method: 'DELETE' }),
    'Post usunięty',
  );
  if (wasRemoved) {
    emit('changed');
  }
};
</script>

<template>
  <article
    :id="`post-${post.id}`"
    class="grid reveal scroll-mt-16 overflow-hidden panel target:border-cosmo-500 target:shadow-aura md:grid-cols-[11rem_minmax(0,1fr)]"
  >
    <aside
      class="flex gap-3 border-aqua-500/15 bg-black/30 p-4 max-md:items-center max-md:border-b md:flex-col md:items-center md:border-r md:text-center"
    >
      <img
        v-if="post.author.avatarUrl"
        :src="post.author.avatarUrl"
        alt=""
        class="size-12 rounded-full border border-gold-300/40 md:size-16"
        loading="lazy"
        referrerpolicy="no-referrer"
      />
      <span
        v-else
        class="grid size-12 shrink-0 place-items-center rounded-full border font-display text-xl font-bold md:size-16 md:text-2xl"
        :class="post.author.isGhost ? 'border-aqua-500/30 text-aqua-500' : 'border-gold-300/50 text-gold-300'"
        aria-hidden="true"
      >
        {{ initialOf(post.author.name) }}
      </span>
      <div class="min-w-0">
        <p class="truncate font-semibold" :class="post.author.isGhost ? 'text-aqua-300' : 'text-gold-300'">
          {{ post.author.name }}
        </p>
        <p v-if="post.author.isGhost" class="text-[0.65rem] tracking-wide text-aqua-500 uppercase">
          {{ GHOST_USER_CAPTION }}
        </p>
        <p class="text-xs text-aqua-500">{{ pluralize(post.author.postCount, 'post', 'posty', 'postów') }}</p>
      </div>
    </aside>
    <div class="flex min-w-0 flex-col">
      <header
        class="flex items-center justify-between gap-3 border-b border-aqua-500/10 px-5 py-2 text-xs text-aqua-500"
      >
        <time :datetime="post.createdAt">{{ formatDateTime(post.createdAt) }}</time>
        <div class="flex items-center gap-1.5">
          <BaseButton v-if="canEdit && !isEditing" variant="ghost" size="sm" @click="isEditing = true">
            <AppIcon name="edit" />
            Edytuj
          </BaseButton>
          <ConfirmButton v-if="canDelete" @confirm="removePost" />
          <a
            :href="routes.post(post.id)"
            class="ml-1.5 font-semibold text-cosmo-400 hover:text-gold-300"
            :aria-label="`Odnośnik do posta numer ${position}`"
          >
            #{{ position }}
          </a>
        </div>
      </header>
      <PostEditForm
        v-if="isEditing"
        :post-id="post.id"
        :body-html="post.bodyHtml"
        @saved="onEdited"
        @cancel="isEditing = false"
      />
      <template v-else>
        <RichContent :html="post.bodyHtml" class="flex-1 px-5 py-4" />
        <p v-if="post.editedAt" class="px-5 pb-3 text-[0.7rem] text-aqua-500 italic">
          Edytowano {{ formatDateTime(post.editedAt) }}
        </p>
      </template>
    </div>
  </article>
</template>
