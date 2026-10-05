<script setup lang="ts">
defineProps<{ message: string }>();
</script>

<template>
  <p class="panel px-6 py-10 text-center text-sm text-aqua-300">{{ message }}</p>
</template>
