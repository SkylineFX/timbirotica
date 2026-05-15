<script setup lang="ts">
const route = useRoute()
const categorySlug = computed(() => route.params.slug as string)
const title = computed(() => categorySlug.value.replace(/-/g, ' ').charAt(0).toUpperCase() + categorySlug.value.replace(/-/g, ' ').slice(1))
const apiQuery = computed(() => ({ category: categorySlug.value }))
const breadcrumbs = computed(() => [
  { label: 'Acasa', to: '/' },
  { label: title.value, to: route.path }
])

useSeoMeta({
  title: () => title.value
})
</script>

<template>
  <ProductList
    :title="title"
    :apiQuery="apiQuery"
    :breadcrumbs="breadcrumbs"
    emptyMessage="Nu au fost gasite produse in aceasta categorie."
  />
</template>
