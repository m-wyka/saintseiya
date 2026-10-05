<script setup lang="ts">
import { routes } from '#shared/utils/routes';

interface ModeratedThread {
  id: number;
  isLocked: boolean;
  isSticky: boolean;
  forum: { id: number; slug: string };
}

const props = defineProps<{ thread: ModeratedThread }>();
const emit = defineEmits<{ changed: [] }>();

const moderate = useModerationAction();
const { t } = useI18n();
const localePath = useLocalePath();
const threadApiUrl = computed(() => `/api/forum/threads/${props.thread.id}`);

const changeThread = async (action: string, body: Record<string, unknown>, successMessage: string) => {
  const wasChanged = await moderate(
    () => apiRequest(`${threadApiUrl.value}/${action}`, { method: 'PATCH', body }),
    successMessage,
  );
  if (wasChanged) {
    emit('changed');
  }
  return wasChanged;
};

const toggleLock = () =>
  changeThread(
    'lock',
    { isLocked: !props.thread.isLocked },
    props.thread.isLocked ? t('POSTS.THREAD_OPENED') : t('POSTS.THREAD_LOCKED'),
  );

const toggleSticky = () =>
  changeThread(
    'sticky',
    { isSticky: !props.thread.isSticky },
    props.thread.isSticky ? t('POSTS.THREAD_UNPINNED') : t('POSTS.THREAD_PINNED'),
  );

const removeThread = async () => {
  const wasRemoved = await moderate(
    () => apiRequest(threadApiUrl.value, { method: 'DELETE' }),
    t('POSTS.THREAD_DELETED'),
  );
  if (wasRemoved) {
    await navigateTo(localePath(routes.forum(props.thread.forum.slug)));
  }
};

const isChoosingForum = ref(false);
const otherForums = ref<{ value: number; label: string }[]>([]);
const targetForumId = ref<number>();

const startMove = async () => {
  const categories = await $fetch('/api/forum').catch(() => []);
  otherForums.value = categories
    .flatMap((category) => category.forums)
    .filter((forum) => forum.id !== props.thread.forum.id)
    .map((forum) => ({ value: forum.id, label: forum.name }));
  targetForumId.value = otherForums.value[0]?.value;
  isChoosingForum.value = true;
};

const moveThread = async () => {
  if (targetForumId.value === undefined) {
    return;
  }
  const wasMoved = await changeThread('forum', { forumId: targetForumId.value }, t('POSTS.THREAD_MOVED'));
  if (wasMoved) {
    isChoosingForum.value = false;
  }
};
</script>

<template>
  <section class="mb-4 flex flex-col gap-3 panel px-4 py-3" :aria-label="t('POSTS.MODERATION')">
    <div class="flex flex-wrap items-center gap-1.5">
      <p class="mr-auto text-xs font-semibold tracking-wide text-aqua-500 uppercase">{{ t('POSTS.MODERATION') }}</p>
      <BaseButton variant="ghost" size="sm" @click="toggleLock">
        <AppIcon name="lock" />
        {{ thread.isLocked ? t('POSTS.UNLOCK') : t('POSTS.LOCK') }}
      </BaseButton>
      <BaseButton variant="ghost" size="sm" @click="toggleSticky">
        <AppIcon name="pin" />
        {{ thread.isSticky ? t('POSTS.UNPIN') : t('POSTS.PIN') }}
      </BaseButton>
      <BaseButton variant="ghost" size="sm" :aria-expanded="isChoosingForum" @click="startMove">
        <AppIcon name="folder" />
        {{ t('POSTS.MOVE') }}
      </BaseButton>
      <ConfirmButton :label="t('POSTS.DELETE_THREAD')" :question="t('CONFIRM.DELETE_THREAD')" @confirm="removeThread" />
    </div>
    <form v-if="isChoosingForum" class="flex flex-wrap items-end gap-2" @submit.prevent="moveThread">
      <BaseSelect
        v-model="targetForumId"
        :label="t('POSTS.TARGET_FORUM')"
        :options="otherForums"
        class="min-w-56 flex-1"
      />
      <BaseButton type="submit" size="sm" :disabled="targetForumId === undefined">
        <AppIcon name="check" />
        {{ t('POSTS.MOVE_THREAD') }}
      </BaseButton>
      <BaseButton variant="ghost" size="sm" @click="isChoosingForum = false">{{ t('GENERAL.CANCEL') }}</BaseButton>
    </form>
  </section>
</template>
