<script setup lang="ts">
import { findCategory } from '~~/shared/utils/categoryTree'

const route = useRoute()
const categorySlug = computed(() => route.params.slug as string)

// The stored name comes from the category tree, which the header menu loads
// too (same request, useCatalogMenus.ts). An unknown category is a 404, not an
// empty listing.
const { data: categoryTree, error } = await useCategoryTree()
const category = computed(() => findCategory(categoryTree.value ?? [], node => node.to === `/c/${categorySlug.value}`))
if (!category.value) {
  throw createError(error.value
    ? { statusCode: error.value.statusCode ?? 500, fatal: true }
    : { statusCode: 404, message: 'Categoria nu a fost gasita.', fatal: true })
}

const title = computed(() => category.value?.label ?? '')
const apiQuery = computed(() => ({ category: categorySlug.value }))
const breadcrumbs = computed(() => [
  { label: 'Acasa', to: '/' },
  { label: title.value, to: route.path }
])

const description = computed(() =>
  `Descopera ${title.value.toLowerCase()} la preturi avantajoase. Cumpara online cu livrare in toata Romania.`
)

useSeoMeta({
  title: () => title.value,
  description: () => description.value,
  ogTitle: () => `${title.value} · Timbirotica`,
  ogDescription: () => description.value,
})
</script>

<template>
  <ProductList
    :title="title"
    :api-query="apiQuery"
    :breadcrumbs="breadcrumbs"
    empty-message="Nu au fost gasite produse in aceasta categorie."
  />
</template>
