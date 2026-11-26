<script setup lang="ts">
import { ref, computed } from 'vue'
import type { InternalApi } from 'nitropack/types'
import { findCategory } from '~~/shared/utils/categoryTree'

// The listing endpoint's own response type: a hand-written copy here had
// drifted (an `image` field the API doesn't send, no `stock`).
type ApiResponse = InternalApi['/api/products']['get']

const props = defineProps<{
  categoryId?: number
  recommended?: boolean
  title?: string
}>()

const displayTitle = ref(props.title)
const displayLink = ref<string | undefined>(undefined)
const fetchUrl = ref<string | undefined>(undefined)

if (props.categoryId) {
  // The category's name and link come from the tree the header menu loads
  // (same request, useCatalogMenus.ts), not from a request of their own.
  const { data: categoryTree } = await useCategoryTree()
  const category = findCategory(categoryTree.value ?? [], (node) => node.id === props.categoryId)
  if (category) {
    if (!displayTitle.value) {
      displayTitle.value = category.label
    }
    displayLink.value = category.to
    // The product list filters by slug, the end of the category's /c/<slug> link.
    fetchUrl.value = `/api/products?category=${category.to.slice('/c/'.length)}&limit=10&facets=0`
  }
} else if (props.recommended) {
  if (!displayTitle.value) {
    displayTitle.value = 'Produse Recomandate'
  }
  displayLink.value = '/produse-recomandate'
  fetchUrl.value = `/api/products?recommended=true&limit=10&facets=0`
}

const { data: response } = await useFetch<ApiResponse>(() => fetchUrl.value || '')

const items = computed(() => response.value?.products?.slice(0, 10) || [])
</script>

<template>
  <div class="flex flex-col gap-4">
    <div
      v-if="displayTitle"
      class="flex items-baseline justify-between border-b border-gray-200 pb-1 sm:justify-start"
    >
      <h3 class="text-xl font-bold lg:text-2xl">{{ displayTitle }}</h3>
      <UButton
        v-if="displayLink"
        class="self-center py-0 text-xs"
        :to="displayLink"
        :aria-label="`Vezi tot: ${displayTitle}`"
        color="primary"
        variant="link"
      >
        <span class="block sm:hidden">Vezi tot</span>
        <template #trailing>
          <UIcon name="i-lucide-arrow-right" class="h-4 w-4 sm:h-5 sm:w-5" />
        </template>
      </UButton>
    </div>
    <UCarousel
      v-slot="{ item }"
      :items="items"
      align="start"
      :ui="{
        viewport: '-m-1 p-1',
        container: '-ml-2',
        item: 'basis-1/2 sm:basis-1/3 lg:basis-1/5 pl-2',
        arrows: 'hidden sm:flex absolute right-4 sm:right-[35px] -top-[35px] items-center z-10'
      }"
      arrows
      prev-icon="i-lucide-chevron-left"
      next-icon="i-lucide-chevron-right"
      :prev="{ color: 'neutral', variant: 'link', size: 'xl' }"
      :next="{ color: 'neutral', variant: 'link', size: 'xl' }"
    >
      <ProductCard
        :key="item.id"
        :to="`/c/${item.category?.slug}/${item.slug}`"
        :product="item"
        class="w-full"
      />
    </UCarousel>
  </div>
</template>
