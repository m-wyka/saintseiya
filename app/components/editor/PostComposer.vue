<script setup lang="ts">
interface ComposedPost {
  bodyHtml: string;
  captchaToken: string;
}

const props = defineProps<{ label: string; submitLabel: string; send: (post: ComposedPost) => Promise<unknown> }>();
const emit = defineEmits<{ sent: [] }>();

const bodyHtml = ref('');
const captchaToken = ref('');
const captcha = ref<{ reset: () => void } | null>(null);
const { isBusy, errorMessage, run } = useApiAction();

const submit = async () => {
  const wasSent = await run(() => props.send({ bodyHtml: bodyHtml.value, captchaToken: captchaToken.value }));
  captcha.value?.reset();
  if (wasSent) {
    bodyHtml.value = '';
    emit('sent');
  }
};
</script>

<template>
  <form class="flex flex-col gap-3" @submit.prevent="submit">
    <slot />
    <ClientOnly>
      <RichTextEditor v-model="bodyHtml" :label="label" />
      <template #fallback>
        <div class="h-48 animate-pulse rounded-xl border border-aqua-500/20 bg-black/30" />
      </template>
    </ClientOnly>
    <CaptchaField ref="captcha" v-model="captchaToken" />
    <p v-if="errorMessage" class="flex items-center gap-2 text-sm text-danger" role="alert">
      <AppIcon name="warning" />
      {{ errorMessage }}
    </p>
    <div class="flex justify-end">
      <BaseButton type="submit" :busy="isBusy" :disabled="!bodyHtml">
        <AppIcon name="send" />
        {{ submitLabel }}
      </BaseButton>
    </div>
  </form>
</template>
