<script setup lang="ts">
const route = useRoute()
const categorySlug = computed(() => route.params.slug as string)

const limit = 12
const page = computed({
  get: () => Number(route.query.page) || 1,
  set: async (val) => {
    if (val === page.value) return
    await navigateTo({ query: { ...route.query, page: val } })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
})

const { data, status, refresh } = await useFetch('/api/products', {
    query: computed(() => ({
        category: categorySlug.value,
        page: page.value,
        limit
    })),
    watch: [page, categorySlug]
})

const products = computed(() => data.value?.products || [])
const total = computed(() => data.value?.total || 0)
</script>

<template>
  <UContainer class="py-6">
    <h1 class="text-xl font-bold mb-8 capitalize">{{ categorySlug.replace(/-/g, ' ') }}</h1>

    <div v-if="products?.length" class="space-y-8">
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 lg:gap-4">
            <ProductCard
                v-for="product in products" 
                :key="product.id" 
                :to="`/categorii/${categorySlug}/${product.slug}`"
                :product="product"
            />
        </div>
        
        <div class="flex justify-center">
            <UPagination 
                v-model:page="page"
                :total="total" 
                :items-per-page="limit" 
            />
        </div>
    </div>
    <div v-else-if="status === 'pending'" class="py-12 flex justify-center">
        <UIcon name="i-lucide-loader-2" class="animate-spin w-8 h-8" />
    </div>
    <div v-else class="text-center py-12 text-gray-500">
        Nu au fost gasite produse in aceasta categorie.
    </div>
  </UContainer>
</template>
