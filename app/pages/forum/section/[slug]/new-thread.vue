<script setup lang="ts">
import { routes } from '#shared/utils/routes';

definePageMeta({ middleware: 'auth' });

const route = useRoute('forum-section-slug-new-thread');
const { data, error } = await useFetch(() => `/api/forum/forums/${route.params.slug}`);

if (error.value || !data.value) {
  throw createError({
    statusCode: error.value?.statusCode ?? 404,
    statusMessage: 'Nie znaleziono działu',
    fatal: true,
  });
}

const title = ref('');

const createThread = async (post: { bodyHtml: string; captchaToken: string }) => {
  const created = await apiRequest<{ threadId: number }>('/api/forum/threads', {
    method: 'POST',
    body: { forumSlug: route.params.slug, title: title.value, ...post },
  });
  await navigateTo(routes.thread(created.threadId));
};

useSeoMeta({ title: 'Nowy temat' });
</script>

<template>
  <div v-if="data">
    <BreadcrumbTrail
      :items="[
        { title: 'Forum', to: routes.forumIndex() },
        { title: data.forum.name, to: routes.forum(data.forum.slug) },
      ]"
    />
    <PageHeading title="Nowy temat" :subtitle="`Dział: ${data.forum.name}`" />
    <div class="panel p-6">
      <PostComposer label="Treść pierwszego posta" submit-label="Załóż temat" :send="createThread">
        <BaseInput v-model="title" label="Tytuł tematu" :maxlength="100" required />
      </PostComposer>
    </div>
  </div>
</template>
