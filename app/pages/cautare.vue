<script setup lang="ts">
const route = useRoute()
const searchQuery = computed(() => route.query.q as string || '')
const apiQuery = computed(() => ({ q: searchQuery.value }))
</script>

<template>
  <ProductList
    title="Rezultate căutare:"
    :subtitle="searchQuery"
    :apiQuery="apiQuery"
    :emptyMessage="`Nu au fost gasite produse pentru căutarea: &quot;${searchQuery}&quot;.`"
  />
</template>
