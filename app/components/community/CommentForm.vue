<script setup lang="ts">
import type { CommentTarget } from '#shared/utils/content';

const props = defineProps<{ targetKind: CommentTarget; targetId: number }>();
const emit = defineEmits<{ posted: [] }>();

const { loggedIn } = useUserSession();
const toasts = useToastStore();
const { t } = useI18n();

const sendComment = (post: { bodyHtml: string; captchaToken: string }) =>
  apiRequest('/api/comments', {
    method: 'POST',
    body: { targetKind: props.targetKind, targetId: props.targetId, ...post },
  });

const onSent = () => {
  toasts.success(t('COMMENTS.ADDED'));
  emit('posted');
};
</script>

<template>
  <div>
    <div v-if="loggedIn" class="panel p-5">
      <h3 class="mb-3 heading-display text-lg text-gold-300">{{ t('COMMENTS.ADD') }}</h3>
      <PostComposer
        :label="t('COMMENTS.BODY_LABEL')"
        :submit-label="t('COMMENTS.ADD')"
        :send="sendComment"
        @sent="onSent"
      />
    </div>
    <p v-else class="flex flex-wrap items-center justify-between gap-3 panel px-5 py-4 text-sm text-aqua-300">
      {{ t('COMMENTS.SIGN_IN_PROMPT') }}
      <LoginLink />
    </p>
  </div>
</template>
