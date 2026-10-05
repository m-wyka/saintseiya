<script setup lang="ts">
const { t } = useI18n();
const route = useRoute();
const page = computed(() => Number(route.query.page) || 1);
const { data: shouts, refresh } = await useFetch('/api/shouts', { query: { page } });

const { loggedIn } = useUserSession();
const { isBusy, errorMessage, run } = useApiAction();
const message = ref('');

const sendShout = async () => {
  const sent = await run(() => apiRequest('/api/shouts', { method: 'POST', body: { message: message.value } }));
  if (sent) {
    message.value = '';
    await refresh();
  }
};

useSeoMeta({ title: () => t('SHOUTBOX.TITLE') });
</script>

<template>
  <div>
    <PageHeading :title="t('SHOUTBOX.TITLE')" :subtitle="t('SHOUTBOX.SUBTITLE')" />
    <form v-if="loggedIn" class="mb-5 flex items-end gap-3 panel p-4" @submit.prevent="sendShout">
      <BaseInput
        v-model="message"
        class="flex-1"
        :label="t('SHOUTBOX.MESSAGE_LABEL')"
        :maxlength="300"
        :error="errorMessage"
        required
      />
      <BaseButton type="submit" :busy="isBusy" :disabled="!message.trim()">
        <AppIcon name="send" />
        {{ t('GENERAL.SEND') }}
      </BaseButton>
    </form>
    <p v-else class="mb-5 flex flex-wrap items-center justify-between gap-3 panel px-5 py-4 text-sm text-aqua-300">
      {{ t('SHOUTBOX.SIGN_IN_PROMPT') }}
      <LoginLink />
    </p>
    <ol v-if="shouts?.items.length" class="overflow-hidden panel">
      <li
        v-for="shout in shouts.items"
        :key="shout.id"
        class="grid gap-x-4 gap-y-1 border-b border-aqua-500/10 px-5 py-3 last:border-b-0 sm:grid-cols-[11rem_minmax(0,1fr)]"
      >
        <p class="text-xs text-aqua-500">
          <AuthorName :author="shout.author" class="text-sm" />
          <time :datetime="shout.createdAt" class="block">{{ formatDateTime(shout.createdAt) }}</time>
        </p>
        <RichContent :html="shout.bodyHtml" />
      </li>
    </ol>
    <EmptyState v-else :message="t('SHOUTBOX.EMPTY')" />
    <PaginationNav v-if="shouts" :page="shouts.page" :page-count="shouts.pageCount" />
  </div>
</template>
