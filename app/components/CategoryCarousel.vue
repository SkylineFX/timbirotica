<script setup lang="ts">
import { ref, computed } from 'vue'
interface Product {
  id: number
  name: string
  slug: string
  price: number
  image: string | null
  category?: {
    slug: string
  } | null
  sku?: string
}

interface ApiResponse {
  products: Product[]
  total: number
  page: number
  limit: number
}

const props = defineProps<{
    categoryId?: number
    recommended?: boolean
    title?: string
}>()

const displayTitle = ref(props.title)
const displayLink = ref<string | undefined>(undefined)
const fetchUrl = ref<string | undefined>(undefined)

if (props.categoryId) {
  const { data: category } = await useFetch<any>(`/api/categories/${props.categoryId}`)
  if (category.value) {
    if (!displayTitle.value) {
      displayTitle.value = category.value.name
    }
    displayLink.value = `/c/${category.value.slug}`
    fetchUrl.value = `/api/products?category=${category.value.slug}&limit=10`
  }
} else if (props.recommended) {
  if (!displayTitle.value) {
    displayTitle.value = 'Produse Recomandate'
  }
  displayLink.value = '/recommended'
  fetchUrl.value = `/api/products?recommended=true&limit=10`
}

const { data: response } = await useFetch<ApiResponse>(() => fetchUrl.value || '')

const items = computed(() => response.value?.products?.slice(0, 10) || [])
</script>

<template>
  <div class="flex flex-col gap-4">
    <div v-if="displayTitle" class="flex justify-between sm:justify-start items-baseline border-b border-gray-200 pb-1">
      <h3 class="text-xl lg:text-2xl font-bold">{{ displayTitle }}</h3>
      <UButton v-if="displayLink" class="text-xs py-0 self-center" :to="displayLink" color="primary" variant="link">
        <span class="block sm:hidden">Vezi tot</span>
        <template #trailing>
          <UIcon name="i-lucide-arrow-right" class="w-4 sm:w-5 h-4 sm:h-5" />
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
