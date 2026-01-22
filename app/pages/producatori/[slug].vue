<script setup lang="ts">
const route = useRoute()
</script>

<template>
  <UContainer class="py-12">
    <h1 class="text-3xl font-bold mb-8">{{ route.params.slug }}</h1>
  </UContainer>
</template>
