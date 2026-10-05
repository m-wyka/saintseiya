<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md';

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant;
    size?: ButtonSize;
    to?: RouteLocationRaw;
    href?: string;
    type?: 'button' | 'submit';
    disabled?: boolean;
    busy?: boolean;
  }>(),
  { variant: 'primary', size: 'md', to: undefined, href: undefined, type: 'button' },
);

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'cosmo-bar text-abyss-950 hover:shadow-aura hover:brightness-110',
  secondary:
    'border border-cosmo-500/60 text-cosmo-400 hover:border-cosmo-400 hover:bg-cosmo-500/10 hover:text-gold-300',
  ghost: 'text-aqua-300 hover:bg-white/5 hover:text-gold-300',
  danger: 'border border-danger/60 text-danger hover:bg-danger/10',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'gap-1.5 px-3 py-1.5 text-xs',
  md: 'gap-2 px-4 py-2 text-sm',
};

const NuxtLink = resolveComponent('NuxtLinkLocale');
const isUnavailable = computed(() => props.disabled || props.busy);
const tag = computed(() => {
  if (props.to) {
    return NuxtLink;
  }
  return props.href ? 'a' : 'button';
});
const attributes = computed(() => {
  if (props.to) {
    return { to: props.to };
  }
  return props.href
    ? { href: props.href }
    : { type: props.type, disabled: isUnavailable.value, 'aria-busy': props.busy || undefined };
});
</script>

<template>
  <component
    :is="tag"
    v-bind="attributes"
    class="inline-flex cursor-pointer items-center justify-center rounded-md font-semibold tracking-wide transition duration-200 ease-cosmo select-none active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
    :class="[VARIANT_CLASSES[variant], SIZE_CLASSES[size]]"
  >
    <slot />
  </component>
</template>
