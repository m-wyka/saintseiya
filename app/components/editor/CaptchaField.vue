<script setup lang="ts">
interface TurnstileApi {
  render: (
    container: HTMLElement,
    options: { sitekey: string; theme: string; callback: (token: string) => void },
  ) => string;
  reset: (widgetId: string) => void;
}

const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const SCRIPT_POLL_INTERVAL_MS = 150;

const token = defineModel<string>({ default: '' });
const siteKey = useRuntimeConfig().public.turnstileSiteKey;
const container = ref<HTMLElement | null>(null);
let widgetId: string | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;

const turnstile = () => (window as unknown as { turnstile?: TurnstileApi }).turnstile;

const renderWidget = () => {
  const api = turnstile();
  if (!api || !container.value || widgetId !== null) {
    return;
  }
  widgetId = api.render(container.value, {
    sitekey: siteKey,
    theme: 'dark',
    callback: (value) => (token.value = value),
  });
  stopPolling();
};

const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
};

const reset = () => {
  token.value = '';
  if (widgetId !== null) {
    turnstile()?.reset(widgetId);
  }
};

if (siteKey) {
  useHead({ script: [{ src: TURNSTILE_SCRIPT_URL, async: true, defer: true }] });
  onMounted(() => {
    pollTimer = setInterval(renderWidget, SCRIPT_POLL_INTERVAL_MS);
    renderWidget();
  });
  onBeforeUnmount(stopPolling);
}

defineExpose({ reset });
</script>

<template>
  <div v-if="siteKey" ref="container" class="min-h-16" />
</template>
