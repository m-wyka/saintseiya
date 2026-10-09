<script setup lang="ts">
import { routes } from '#shared/utils/routes';

const props = withDefaults(
  defineProps<{ author: { id?: number; name: string; isGhost: boolean } | null; linked?: boolean }>(),
  { linked: true },
);

const { t } = useI18n();
const NuxtLink = resolveComponent('NuxtLinkLocale');
const profileAddress = computed(() => (props.linked && props.author?.id ? routes.user(props.author.id) : undefined));
</script>

<template>
  <span v-if="author" class="inline-flex flex-wrap items-baseline gap-x-1.5">
    <component
      :is="profileAddress ? NuxtLink : 'span'"
      :to="profileAddress"
      class="relative z-10 font-semibold"
      :class="[
        author.isGhost ? 'text-aqua-300' : 'text-gold-300',
        { 'transition hover:text-cosmo-400': profileAddress },
      ]"
    >
      {{ author.name }}
    </component>
    <span v-if="author.isGhost" class="text-[0.65rem] tracking-wide text-aqua-500 uppercase">{{
      t('GENERAL.INACTIVE_ACCOUNT')
    }}</span>
  </span>
</template>
