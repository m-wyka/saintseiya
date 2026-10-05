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
    props.thread.isLocked ? 'Temat otwarty' : 'Temat zamknięty',
  );

const toggleSticky = () =>
  changeThread(
    'sticky',
    { isSticky: !props.thread.isSticky },
    props.thread.isSticky ? 'Temat odklejony' : 'Temat przyklejony',
  );

const removeThread = async () => {
  const wasRemoved = await moderate(() => apiRequest(threadApiUrl.value, { method: 'DELETE' }), 'Temat usunięty');
  if (wasRemoved) {
    await navigateTo(routes.forum(props.thread.forum.slug));
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
  const wasMoved = await changeThread('forum', { forumId: targetForumId.value }, 'Temat przeniesiony');
  if (wasMoved) {
    isChoosingForum.value = false;
  }
};
</script>

<template>
  <section class="mb-4 flex flex-col gap-3 panel px-4 py-3" aria-label="Moderacja tematu">
    <div class="flex flex-wrap items-center gap-1.5">
      <p class="mr-auto text-xs font-semibold tracking-wide text-aqua-500 uppercase">Moderacja tematu</p>
      <BaseButton variant="ghost" size="sm" @click="toggleLock">
        <AppIcon name="lock" />
        {{ thread.isLocked ? 'Otwórz' : 'Zamknij' }}
      </BaseButton>
      <BaseButton variant="ghost" size="sm" @click="toggleSticky">
        <AppIcon name="pin" />
        {{ thread.isSticky ? 'Odklej' : 'Przyklej' }}
      </BaseButton>
      <BaseButton variant="ghost" size="sm" :aria-expanded="isChoosingForum" @click="startMove">
        <AppIcon name="folder" />
        Przenieś
      </BaseButton>
      <ConfirmButton label="Usuń temat" confirm-label="Usunąć cały temat?" @confirm="removeThread" />
    </div>
    <form v-if="isChoosingForum" class="flex flex-wrap items-end gap-2" @submit.prevent="moveThread">
      <BaseSelect v-model="targetForumId" label="Dział docelowy" :options="otherForums" class="min-w-56 flex-1" />
      <BaseButton type="submit" size="sm" :disabled="targetForumId === undefined">
        <AppIcon name="check" />
        Przenieś temat
      </BaseButton>
      <BaseButton variant="ghost" size="sm" @click="isChoosingForum = false">Anuluj</BaseButton>
    </form>
  </section>
</template>
