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
    id?: string
    url: string
    title?: string
    link?: string
}>()


const { data: response } = await useFetch<ApiResponse>(() => props.url)

const items = computed(() => response.value?.products?.slice(0, 6) || [])
</script>

<template>
  <div class="flex flex-col gap-4">
    <div v-if="title" class="flex justify-between items-center">
      <h3 class="text-xl lg:text-2xl font-bold">{{ title }}</h3>
      <UButton v-if="link" class="text-sm" trailing-icon="i-lucide-arrow-right" label="Mai multe" :to="link" color="primary" variant="link" />
    </div>
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
  </div>
</template>
