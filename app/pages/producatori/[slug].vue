<script setup lang="ts">
const route = useRoute()
const brandSlug = computed(() => route.params.slug as string)
const title = computed(() => brandSlug.value.replace(/-/g, ' ').charAt(0).toUpperCase() + brandSlug.value.replace(/-/g, ' ').slice(1))
const apiQuery = computed(() => ({ brand: brandSlug.value }))
const breadcrumbs = computed(() => [
  { label: 'Acasa', to: '/' },
  { label: title.value, to: route.path }
])

const description = computed(() =>
  `Produse marca ${title.value} la preturi avantajoase. Comanda online cu livrare rapida in Bucuresti. - Eurotimalex`
)

useSeoMeta({
  title: () => "Produse " + title.value + " - Eurotimalex.ro",
  description: () => description.value,
  ogTitle: () => title.value,
  ogDescription: () => description.value,
  ogType: 'website',
  twitterCard: 'summary',
  twitterTitle: () => title.value,
  twitterDescription: () => description.value
})
</script>

<template>
  <ProductList
    :title="title"
    :apiQuery="apiQuery"
    :breadcrumbs="breadcrumbs"
    emptyMessage="Nu au fost gasite produse pentru acest producator."
  />
</template>
