<script setup lang="ts">
const route = useRoute()
const title = "Produse Recomandate"
const apiQuery = computed(() => ({ recommended: 'true' }))
const breadcrumbs = computed(() => [
  { label: 'Acasa', to: '/' },
  { label: title, to: route.path }
])
</script>

<template>
  <ProductList
    :title="title"
    :apiQuery="apiQuery"
    :breadcrumbs="breadcrumbs"
    emptyMessage="Nu am gasit produse recomandate in acest moment."
  />
</template>
