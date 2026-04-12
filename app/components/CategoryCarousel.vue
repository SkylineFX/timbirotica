<script setup lang="ts">

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
    <div v-if="displayTitle" class="flex justify-between items-center">
      <h3 class="text-xl lg:text-2xl font-bold">{{ displayTitle }}</h3>
      <UButton v-if="displayLink" class="text-sm" trailing-icon="i-lucide-arrow-right" label="Mai multe" :to="displayLink" color="primary" variant="link" />
    </div>
    <UCarousel
      v-slot="{ item }: { item: any }"
      :items="items"
      :ui="{ item: 'basis-1/2 sm:basis-1/3 lg:basis-1/5 m-[2px]' }"
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
