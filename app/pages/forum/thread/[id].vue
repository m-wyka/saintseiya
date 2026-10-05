<script setup lang="ts">
import { hasPermission } from '#shared/utils/roles';
import { routes } from '#shared/utils/routes';

const POSTS_PER_PAGE = 20;

const route = useRoute('forum-temat-id');
const page = computed(() => Number(route.query.page) || 1);
const { data, error, refresh } = await useFetch(() => `/api/forum/threads/${route.params.id}`, { query: { page } });

if (error.value || !data.value) {
  throw createError({
    statusCode: error.value?.statusCode ?? 404,
    statusMessage: 'Nie znaleziono tematu',
    fatal: true,
  });
}

const firstPositionOnPage = computed(() => (page.value - 1) * POSTS_PER_PAGE + 1);

const { loggedIn, user } = useUserSession();
const canModerate = computed(() => hasPermission(user.value, 'forum'));
const canReply = computed(() => !data.value?.thread.isLocked || canModerate.value);
const canEditPostOf = (authorId: number) => canModerate.value || authorId === user.value?.id;

const reloadPosts = async () => {
  await refresh();
  const lastPage = data.value?.posts.pageCount ?? 1;
  if (page.value > lastPage) {
    await navigateTo({ path: route.path, query: { page: lastPage > 1 ? lastPage : undefined } });
  }
};

const sendReply = async (post: { bodyHtml: string; captchaToken: string }) => {
  const created = await apiRequest<{ postId: number; page: number }>(`/api/forum/threads/${route.params.id}/posts`, {
    method: 'POST',
    body: post,
  });
  if (created.page === page.value) {
    await refresh();
  }
  await navigateTo({
    path: route.path,
    query: { page: created.page > 1 ? created.page : undefined },
    hash: `#post-${created.postId}`,
  });
};

useSeoMeta({ title: () => `${data.value?.thread.title ?? ''} – Forum` });
</script>

<template>
  <div v-if="data">
    <BreadcrumbTrail
      :items="[
        { title: 'Forum', to: routes.forumIndex() },
        { title: data.thread.forum.name, to: routes.forum(data.thread.forum.slug) },
      ]"
    />
    <PageHeading
      :title="data.thread.title"
      :subtitle="`${pluralize(data.thread.postCount, 'post', 'posty', 'postów')} · ${pluralize(data.thread.viewCount, 'odsłona', 'odsłony', 'odsłon')}`"
    />
    <p
      v-if="data.thread.isLocked"
      class="mb-4 flex items-center gap-2 rounded-lg border border-aqua-500/30 bg-black/30 px-4 py-2 text-sm text-aqua-300"
    >
      <AppIcon name="lock" class="text-cosmo-500" />
      Temat jest zamknięty — nie można w nim odpowiadać.
    </p>
    <ThreadModeration v-if="canModerate" :thread="data.thread" @changed="refresh()" />
    <div class="flex flex-col gap-4">
      <PostCard
        v-for="(post, index) in data.posts.items"
        :key="post.id"
        :post="post"
        :position="firstPositionOnPage + index"
        :can-edit="canEditPostOf(post.author.id)"
        :can-delete="canModerate && firstPositionOnPage + index > 1"
        @changed="reloadPosts"
      />
    </div>
    <PaginationNav :page="data.posts.page" :page-count="data.posts.pageCount" />
    <section v-if="canReply" class="mt-8">
      <div v-if="loggedIn" class="panel p-5">
        <h2 class="mb-3 heading-display text-lg text-gold-300">Odpowiedz</h2>
        <PostComposer label="Treść odpowiedzi" submit-label="Wyślij odpowiedź" :send="sendReply" />
      </div>
      <p v-else class="flex flex-wrap items-center justify-between gap-3 panel px-5 py-4 text-sm text-aqua-300">
        Zaloguj się, aby odpowiedzieć w tym temacie.
        <LoginLink />
      </p>
    </section>
  </div>
</template>
