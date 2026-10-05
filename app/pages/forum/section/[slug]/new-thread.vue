<script setup lang="ts">
import { routes } from '#shared/utils/routes';

definePageMeta({ middleware: 'auth' });

const { t } = useI18n();
const localePath = useLocalePath();
const routeSlug = useRouteParam('slug');
const { data, error } = await useFetch(() => `/api/forum/forums/${routeSlug.value}`);

if (error.value || !data.value) {
  throw createError({
    statusCode: error.value?.statusCode ?? 404,
    statusMessage: t('FORUM.SECTION_NOT_FOUND'),
    fatal: true,
  });
}

const title = ref('');

const createThread = async (post: { bodyHtml: string; captchaToken: string }) => {
  const created = await apiRequest<{ threadId: number }>('/api/forum/threads', {
    method: 'POST',
    body: { forumSlug: routeSlug.value, title: title.value, ...post },
  });
  await navigateTo(localePath(routes.thread(created.threadId)));
};

useSeoMeta({ title: () => t('FORUM.NEW_THREAD') });
</script>

<template>
  <div v-if="data">
    <BreadcrumbTrail
      :items="[
        { title: t('GENERAL.FORUM'), to: routes.forumIndex() },
        { title: data.forum.name, to: routes.forum(data.forum.slug) },
      ]"
    />
    <PageHeading :title="t('FORUM.NEW_THREAD')" :subtitle="t('FORUM.SECTION_LABEL', { name: data.forum.name })" />
    <div class="panel p-6">
      <PostComposer :label="t('FORUM.FIRST_POST_LABEL')" :submit-label="t('FORUM.CREATE_THREAD')" :send="createThread">
        <BaseInput v-model="title" :label="t('FORUM.THREAD_TITLE_LABEL')" :maxlength="100" required />
      </PostComposer>
    </div>
  </div>
</template>
