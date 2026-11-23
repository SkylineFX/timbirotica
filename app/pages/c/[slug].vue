<script setup lang="ts">
const route = useRoute()
const categorySlug = computed(() => route.params.slug as string)

// The stored name comes from the category tree, which the header menu loads
// too (same request, useCatalogMenus.ts). An unknown category is a 404, not an
// empty listing.
const { data: categoryTree, error } = await useCategoryTree()
type CategoryNode = { label: string, to: string, children?: CategoryNode[] }
const findByLink = (nodes: CategoryNode[], to: string): CategoryNode | undefined => {
  for (const node of nodes) {
    if (node.to === to) return node
    const found = findByLink(node.children ?? [], to)
    if (found) return found
  }
}
const category = computed(() => findByLink(categoryTree.value ?? [], `/c/${categorySlug.value}`))
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
  `Descopera ${title.value.toLowerCase()} la preturi avantajoase. Cumpara online cu livrare rapida in Bucuresti.`
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
    :apiQuery="apiQuery"
    :breadcrumbs="breadcrumbs"
    emptyMessage="Nu au fost gasite produse in aceasta categorie."
  />
</template>
