<script setup lang="ts">
const route = useRoute()
const brandSlug = computed(() => route.params.slug as string)

// The stored name comes from the brand list, which the header menu loads too
// (same request, useCatalogMenus.ts). An unknown brand is a 404, not an empty
// listing.
const { data: brands, error } = await useBrandList()
const brand = computed(() => brands.value?.find(b => b.to === `/producatori/${brandSlug.value}`))
if (!brand.value) {
  throw createError(error.value
    ? { statusCode: error.value.statusCode ?? 500, fatal: true }
    : { statusCode: 404, message: 'Producatorul nu a fost gasit.', fatal: true })
}

const title = computed(() => brand.value?.label ?? '')
const apiQuery = computed(() => ({ brand: brandSlug.value }))
const breadcrumbs = computed(() => [
  { label: 'Acasa', to: '/' },
  { label: title.value, to: route.path }
])

const description = computed(() =>
  `Produse marca ${title.value} la preturi avantajoase. Comanda online cu livrare in toata Romania.`
)

useSeoMeta({
  title: () => `Produse ${title.value}`,
  description: () => description.value,
  ogTitle: () => `Produse ${title.value} · Timbirotica`,
  ogDescription: () => description.value,
})
</script>

<template>
  <ProductList
    :title="title"
    :api-query="apiQuery"
    :breadcrumbs="breadcrumbs"
    empty-message="Nu au fost gasite produse pentru acest producator."
  />
</template>
