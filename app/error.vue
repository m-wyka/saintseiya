<script setup lang="ts">
import type { NuxtError } from '#app';

const props = defineProps<{ error: NuxtError }>();

const NOT_FOUND = 404;
const isNotFound = computed(() => props.error.statusCode === NOT_FOUND);
const title = computed(() => (isNotFound.value ? 'Tej strony nie ma w Sanktuarium' : 'Coś poszło nie tak'));
const description = computed(() =>
  isNotFound.value
    ? 'Adres mógł się zmienić po przebudowie portalu albo strona została usunięta.'
    : 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie za chwilę.',
);

const layout = useLayoutStore();
await callOnce('layout', () => layout.load().catch(() => undefined));

useSeoMeta({ title });
</script>

<template>
  <NuxtLayout>
    <div class="flex flex-col items-center gap-5 panel px-6 py-16 text-center">
      <p class="font-display text-7xl font-bold text-cosmo-500 [text-shadow:0_0_40px_rgb(255_155_13/0.6)]">
        {{ error.statusCode }}
      </p>
      <h1 class="heading-display text-2xl text-gold-300">{{ title }}</h1>
      <p class="max-w-md text-sm text-aqua-300">{{ description }}</p>
      <BaseButton @click="clearError({ redirect: '/' })">
        <AppIcon name="home" />
        Wróć na stronę główną
      </BaseButton>
    </div>
  </NuxtLayout>
</template>
