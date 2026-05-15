<script setup lang="ts">
const route = useRoute()
const brandSlug = computed(() => route.params.slug as string)
const title = computed(() => brandSlug.value.replace(/-/g, ' ').charAt(0).toUpperCase() + brandSlug.value.replace(/-/g, ' ').slice(1))
const apiQuery = computed(() => ({ brand: brandSlug.value }))
</script>

<template>
  <ProductList
    :title="title"
    :apiQuery="apiQuery"
    emptyMessage="Nu au fost gasite produse pentru acest producator."
  />
</template>
