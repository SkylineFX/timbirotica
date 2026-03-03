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
    url: string
}>()

const { data: response } = await useFetch<ApiResponse>(() => props.url)

const items = computed(() => response.value?.products?.slice(0, 6) || [])
</script>

<template>
  <UCarousel
    v-slot="{ item }: { item: any }"
    :items="items"
    :ui="{ item: 'basis-1/2 sm:basis-1/3 lg:basis-1/5 m-[2px]' }"
  >
    <ProductCard
      :key="item.id" 
      :to="`/categorii/${item.category?.slug}/${item.slug}`"
      :product="item"
      class="w-full"
    />
  </UCarousel>
</template>
