<script setup lang="ts">
withDefaults(defineProps<{ label?: string }>(), { label: 'Zaloguj przez Google' });
</script>

<template>
  <a
    href="/auth/google"
    class="inline-flex items-center gap-2 rounded-full border border-cosmo-500/60 px-3 py-1.5 text-xs font-semibold text-cosmo-400 transition duration-200 hover:border-cosmo-400 hover:bg-cosmo-500/10 hover:text-gold-300"
  >
    <AppIcon name="user" />
    {{ label }}
  </a>
</template>
