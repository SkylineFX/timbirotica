<script setup lang="ts">
const route = useRoute()
const searchQuery = computed(() => (route.query.q as string) || '')
const apiQuery = computed(() => ({ q: searchQuery.value }))
</script>

<template>
  <ProductList
    title="Rezultate cautare:"
    :subtitle="searchQuery"
    :api-query="apiQuery"
    :empty-message="`Nu au fost gasite produse pentru cautarea: &quot;${searchQuery}&quot;.`"
  />
</template>
