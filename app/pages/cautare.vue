<script setup lang="ts">
const route = useRoute()
const searchQuery = computed(() => route.query.q as string || '')
const apiQuery = computed(() => ({ q: searchQuery.value }))
</script>

<template>
  <ProductList
    title="Rezultate cautare:"
    :subtitle="searchQuery"
    :apiQuery="apiQuery"
    :emptyMessage="`Nu au fost gasite produse pentru cautarea: &quot;${searchQuery}&quot;.`"
  />
</template>
