<script setup lang="ts">
const route = useRoute()
const categorySlug = computed(() => route.params.slug as string)

const limitOptions = [
  { label: '12 pe pagina', value: 12 },
  { label: '24 pe pagina', value: 24 },
  { label: '36 pe pagina', value: 36 },
  { label: '72 pe pagina', value: 72 }
]

const limit = computed({
  get: () => Number(route.query.limit) || 12,
  set: async (val) => {
    if (val === limit.value) return
    await navigateTo({ query: { ...route.query, limit: val, page: 1 } })
  }
})

const page = computed({
  get: () => Number(route.query.page) || 1,
  set: async (val) => {
    if (val === page.value) return
    await navigateTo({ query: { ...route.query, page: val } })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
})

const sortOptions = [
  { label: 'Cele mai noi', value: 'default' },
  { label: 'Preț crescător', value: 'price-asc' },
  { label: 'Preț descrescător', value: 'price-desc' },
  { label: 'Nume: A-Z', value: 'name-asc' },
  { label: 'Nume: Z-A', value: 'name-desc' }
]

const sort = computed({
  get: () => route.query.sort as string || 'default',
  set: async (val) => {
    if (val === sort.value) return
    await navigateTo({ query: { ...route.query, sort: val, page: 1 } })
  }
})

const { data, status, refresh } = await useFetch('/api/products', {
    query: computed(() => ({
        category: categorySlug.value,
        page: page.value,
        sort: sort.value,
        limit: limit.value
    })),
    watch: [page, sort, limit, categorySlug]
})

const products = computed(() => data.value?.products || [])
const total = computed(() => data.value?.total || 0)
</script>

<template>
  <UContainer class="py-6">
    <div class="flex flex-col mb-8 gap-4 rounded-lg p-4 bg-white">
      <h1 class="text-xl font-bold capitalize flex items-baseline gap-2 xl:text-2xl">
        {{ categorySlug.replace(/-/g, ' ') }}
        <span v-if="total !== undefined" class="text-sm font-medium text-gray-500 normal-case">
          ({{ total }} produse)
        </span>
      </h1>
      <div class="flex flex-col sm:flex-row sm:items-center gap-4">
        <div class="flex items-center gap-2">
          <p class="text-sm font-medium text-gray-500">Sorteaza dupa:</p>
          <USelectMenu v-model="sort" :items="sortOptions" value-key="value" label-key="label" class="w-40" />
        </div>
        <div class="flex items-center gap-2">
           <p class="text-sm font-medium text-gray-500">Produse:</p>
           <USelectMenu v-model="limit" :items="limitOptions" value-key="value" label-key="label" class="w-36" />
        </div>
      </div>
    </div>

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
